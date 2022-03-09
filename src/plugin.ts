import path from 'path';
import Boom from '@hapi/boom';
import inert from '@hapi/inert';
import Hapi from '@hapi/hapi';
import AdminJS, { AdminJSOptions, Router as AdminRouter } from 'adminjs';
import sessionAuth from './extensions/session-auth';
import info from './info';

/**
 * Plugin definition for Hapi.js framework.
 * @private
 */

export type AuthOptions = {
  /**
   * Function takes email and password as argument. Should return a logged-in user object or null/false.
   * If provided, the strategy is set to 'session'.
   */
  authenticate?: (email: string, password: string) => Promise<Record<string, any>> | null | false;
  /**
   * Auth strategy for Hapi routes.
   */
  strategy?: string;
  /**
   * This is the name of the cookie if strategy is set to 'session'.
   */
  cookieName?: string;
  /**
   * Cookie password for 'session' strategy.
   */
  cookiePassword?: string;
  /**
   * If cookie should be accessible only via https, defaults to false
   */
  isSecure: boolean;
  /**
   * Cookie options: https://github.com/hapijs/cookie
   */
  [key: string]: any;
};

export type ExtendedAdminJSOptions = AdminJSOptions & {
  /**
   * Should 'inert' be registered by the plugin. Defaults to true. If disabled, you snould register it yourself.
   */
  registerInert: boolean;
  /**
   * Authentication options. You can pass here options specified below and any other option
   * supported by https://github.com/hapijs/cookie
   */
  auth: AuthOptions;
};

/**
 * Actual method that Hapi uses under the hood when you call
 * server.register(plugin, options) method.
 * Options you give in Hapi are passed back to it.
 *
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
const register = async (server: Hapi, options: ExtendedAdminJSOptions) => {
  const { registerInert = true } = options;
  const { routes, assets } = AdminRouter;

  if (options.auth?.authenticate) {
    if (options.auth.strategy && options.auth.strategy !== 'session') {
      throw new Error(`When you give auth.authenticate as a parameter, auth strategy is set to 'session'.
                       Please remove auth.strategy from authentication parameters.
                      `);
    }
    options.auth.strategy = 'session';

    if (!options.auth.cookiePassword) {
      throw new Error('You have to give auth.cookiePassword parameter if you want to use authenticate function.');
    }
  }

  const admin = new AdminJS(options);
  await admin.initialize();

  if (options.auth?.authenticate) {
    await sessionAuth(server, admin);
  }

  routes.forEach((route) => {
    const opts =
      route.method === 'POST'
        ? {
            auth: options.auth?.strategy,
            payload: {
              allow: 'multipart/form-data',
              multipart: { output: 'stream' },
            },
          }
        : {
            auth: options.auth?.strategy,
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

  if (registerInert && inert) {
    await server.register(inert);
  }

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

const AdminJSHapi = {
  name: info?.name ?? '@adminjs/hapi',
  version: info?.version ?? 5,
  register,
};

export default AdminJSHapi;
