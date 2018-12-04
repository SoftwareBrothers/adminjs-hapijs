/**
 * Plugin definition for Hapi.js framework. To se how you can use it
 * see {@link examples/hapijs/index.js}
 *
 * @see module:examples/hapijs~start
 *
 * @module Integrations/hapijs
 */

const Boom = require('boom')
const AdminBro = require('admin-bro')
const SessionAuth = require('./extensions/session-auth')

module.exports = {
  name: 'AdminBro',
  version: '1.0.0',
  register: async (server, options) => {
    const admin = new AdminBro(options)
    let authStrategy = options.auth && options.auth.strategy
    const routes = new AdminBro.Routes({ admin }).all()

    if (options.auth && options.auth.authenticate) {
      if (authStrategy && authStrategy !== 'session') {
        throw new Error(`When you gives auth.authenticate as a parameter - auth strategy is set to "session".
                         Please remove auth.strategy from authentication parameters.
                        `)
      }
      authStrategy = 'session'

      if (!options.auth.cookiePassword) {
        throw new Error('You have to give auth.cookiePassword parameter if you want to use authenticate function')
      }

      await SessionAuth(server, {
        loginPath: admin.options.loginPath,
        logoutPath: admin.options.logoutPath,
        rootPath: admin.options.rootPath,
        cookieName: 'admin-bro',
        ...options.auth,
      }, AdminBro)
    }

    routes.forEach((route) => {
      server.route({
        method: route.method,
        path: `${admin.options.rootPath}${route.path}`,
        options: { auth: authStrategy },
        handler: async (request, h) => {
          try {
            const loggedInUser = request.auth && request.auth.credentials
            const controller = new route.Controller({ admin }, loggedInUser)
            const ret = await controller[route.action](request, h)
            return ret
          } catch (e) {
            console.log(e)
            throw Boom.boomify(e)
          }
        },
      })
    })

    return admin
  },

  renderLogin: async (params) => {
    return AdminBro.renderLogin(params)
  },
}
