/**
 * @module @adminjs/hapi
 * @subcategory Plugins
 * @section modules
 * @description
 *
 * ## Installation
 *
 * ```sh
 * npm install @adminjs/hapi @hapi/boom @hapi/inert
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
 * const AdminJSPlugin = require('@adminjs/hapi')
 * const Hapi = require('@hapi/hapi')
 *
 * const adminJsOptions = {
 *   resources: [YourResource],
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
 * ```
 *
 * The example above will launch the admin panel under default `localhost:8080/admin` url.
 * Routes will be accessible by all users without any authentication.
 *
 * To restrict access, you can pass `auth` via plugin options.
 *
 * ## Authentication options
 *
 * Plugin receives all {@link AdminJSOptions} and one special parameter: `auth`, which controls the authentication.
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
 *   plugin: AdminJSPlugin,
 *   options: { auth: { strategy: 'simple' }, ...otherAdminJSOptions },
 * })
 * //...
 * ```
 *
 * The strategy will be passed down to all AdminJS routes.
 *
 * 3. @adminjs/hapi plugin can be setup to use [auth-cookie](https://github.com/hapijs/hapi-auth-cookie).
 * Only thing you have to do is to define the following {@link module:@adminjs/hapi.register auth options}:
 * _authenticate_, _cookiePassword_, _isSecure_, _cookieName_.
 */
import AdminJSHapi from './plugin.js';
export { AuthOptions, ExtendedAdminJSOptions } from './plugin.js';

export default AdminJSHapi;
