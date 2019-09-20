/**
 * @module admin-bro-hapijs
 * @description
 * 
 * ## Installation
 * 
 * ```sh
 * npm install admin-bro-hapijs boom inert
 * ```
 * 
 * Plugin depends on the following packages and they have to be installed beforehand:
 * - [boom](https://github.com/hapijs/boom) - handling errors
 * - [inert](https://github.com/hapijs/inert) - rendering static assets
 * 
 * If you want to use built-in auth, you'll also need this:
 * - [hapi-auth-cookie](https://github.com/hapijs/hapi-auth-cookie)
 *
 * ## Usage
 *
 * The plugin can be registered using standard `server.register` method.
 * 
 * The simplest example:
 *
 * ```javascript
 * const AdminBroPlugin = require('admin-bro-hapijs')
 * const Hapi = require('hapi')
 *
 * const adminBroOptions = {
 *   resources: [YourResource],
 * }
 *
 * const server = Hapi.server({ port: process.env.PORT || 8080 })
 * const start = async () => {
 *   await server.register({
 *     plugin: AdminBroPlugin,
 *     options: adminBroOptions,
 *   })
 *
 *   await server.start()
 * }
 *
 * start()
 * ```
 * 
 * The example above will launch the admin panel under default `localhost:8080/admin` url.
 * Routes will be accessible by all users without any authentication.
 * 
 * To restrict access, you can pass `auth` via plugin options.
 * 
 * ## Authentication options
 * 
 * Plugin receives all {@link AdminBroOptions} and one special parameter: `auth`, which controls the authentication.
 * 
 * 1. By default, if you won't give `options.auth` - admin panel will be available without the authentication (like in the simplest example above)
 * 2. You can set whatever authentication you prefer for admin routes by setting `options.auth.strategy`. For example:
 * 
 * ```javascript
 * //...
 * await server.register(require('hapi-auth-basic'))
 * server.auth.strategy('simple', 'basic', { validate })
 * 
 * await server.register({
 *   plugin: AdminBroPlugin,
 *   options: { auth: { strategy: 'simple' }, ...otherAdminBroOptions },
 * })
 * //...
 * ```
 * 
 * The strategy will be passed down to all AdminBro routes.
 * 
 * 3. admin-bro-hapijs plugin can be setup to use [auth-cookie](https://github.com/hapijs/hapi-auth-cookie). 
 * Only thing you have to do is to define the following {@link module:admin-bro-hapijs.register auth options}: 
 * _authenticate_, _cookiePassword_, _isSecure_, _cookieName_.
 */

const Plugin = require('./plugin')

module.exports = Plugin
