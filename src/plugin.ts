import path from 'path';
import Boom from '@hapi/boom';
import inert from '@hapi/inert';
import AdminJS, { Router as AdminRouter } from 'adminjs';
import sessionAuth from './extensions/session-auth';

/**
 * Plugin definition for Hapi.js framework.
 * @private
 */

/**
 * Actual method that Hapi uses under the hood when you call
 * server.register(plugin, options) method.
 * Options you give in Hapi are passed back to it.
 *
 * @param  {Object} server                          Hapi.js server
 * @param  {Object} options                         options passed to AdminJS
 * @param  {Object} options.auth                    Authentication options. You can pass here
 *                                                  options described below and any other option
 *                                                  supported by the https://github.com/hapijs/cookie
 * @param  {Object} [options.auth.authenticate]     function takes email and password
 *                                                  as arguments. Should return a logged in
 *                                                  user or null (no authorization), if given
 *                                                  options.auth.strategy is set to 'session'
 * @param  {Object} [options.auth.strategy]         auth strategy for hapi.js routes. By default,
 *                                                  set to none - all admin routes will be
 *                                                  available without authentication
 * @param  {Object} [options.auth.cookieName=adminJs] When auth strategy is set to 'session',
 *                                                  this will be the name of the cookie
 * @param  {Object} [options.auth.cookiePassword]   cookie password for session strategy
 * @param  {Object} [options.auth.isSecure=false]   if cookie should be accessible only via HTTPS,
 *                                                  default to false
 * @return {AdminJS}                               AdminJS instance
 * @function register
 * @static
 * @memberof module:@adminjs/hapi
 * @example
 * const AdminJSPlugin = require('@adminjs/hapi')
 * const Hapi = require('@hapi/hapi')
 *
 * // see AdminJS documentation on database setup.
 * const yourDatabase = require('your-database-setup-file')
 *
 * const ADMIN = {
 *   email: 'text@example.com',
 *   password: 'password',
 * }
 *
 * const adminJsOptions = {
 *   resources: [yourDatabase],
 *   auth: {
 *     authenticate: (email, password) => {
 *       if (ADMIN.email === email && ADMIN.password === password) {
 *         return ADMIN
 *       }
 *       return null
 *     },
 *     strategy: 'session',
 *     cookieName: 'adminJsCookie',
 *     cookiePassword: process.env.COOKIE_PASSWORD || 'makesurepasswordissecure',
 *     isSecure: true, //only https requests
 *   },
 * }
 *
 * const server = Hapi.server({ port: process.env.PORT || 8080 })
 * const start = async () => {
 *   await server.register({
 *     plugin: AdminJSPlugin,
 *     options: adminJsOptions,
 *   })
 *
 *   await server.start()
 * }
 *
 * start()
 */
export const register = async (server, options) => {
  const admin = new AdminJS(options);
  await admin.initialize();
  let authStrategy = options.auth && options.auth.strategy;
  const { routes, assets } = AdminRouter;

  if (options.auth && options.auth.authenticate) {
    if (authStrategy && authStrategy !== 'session') {
      throw new Error(`When you give auth.authenticate as a parameter, auth strategy is set to 'session'.
                       Please remove auth.strategy from authentication parameters.
                      `);
    }
    authStrategy = 'session';

    if (!options.auth.cookiePassword) {
      throw new Error('You have to give auth.cookiePassword parameter if you want to use authenticate function.');
    }

    await sessionAuth(server, admin);
  }

  routes.forEach((route) => {
    const opts =
      route.method === 'POST'
        ? {
            auth: authStrategy,
            payload: {
              allow: 'multipart/form-data',
              multipart: { output: 'stream' },
            },
          }
        : {
            auth: authStrategy,
          };

    server.route({
      method: route.method,
      path: `${admin.options.rootPath}${route.path}`,
      options: opts,
      handler: async (request, h) => {
        try {
          const loggedInUser = request.auth && request.auth.credentials;
          const controller = new route.Controller({ admin }, loggedInUser);
          const ret = await controller[route.action](request, h);
          const response = h.response(ret);
          if (route.contentType) {
            response.type(route.contentType);
          }
          return response;
        } catch (e) {
          if (e.statusCode >= 400 && e.statusCode < 500) {
            throw Boom.boomify(e, { statusCode: e.statusCode });
          } else {
            // eslint-disable-next-line no-console
            console.log(e);
            throw Boom.boomify(e);
          }
        }
      },
    });
  });

  await server.register(inert);

  assets.forEach((asset) => {
    server.route({
      method: 'GET',
      options: { auth: false },
      path: `${admin.options.rootPath}${asset.path}`,
      handler: {
        file: {
          path: path.resolve(asset.src),
          confine: false,
        },
      },
    });
  });

  return admin;
};
