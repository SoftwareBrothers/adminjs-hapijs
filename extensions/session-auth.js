const HapiAuthCookie = require('hapi-auth-cookie')

/**
 * Creates authentication logic for admin users
 * @param  {Hapi} server            Hapi.js server instance
 * @param  {AdminBro} adminBro      adminBro instance
 * @private
 */
const sessionAuth = async (server, adminBro) => {
  const { loginPath, logoutPath, rootPath } = adminBro.options
  const {
    cookiePassword,
    authenticate,
    isSecure,
    defaultMessage,
    cookieName,
    strategy,
    ...other
  } = adminBro.options.auth

  // example authentication is based on the cookie store
  await server.register(HapiAuthCookie)

  server.auth.strategy(strategy, 'cookie', {
    password: cookiePassword,
    cookie: cookieName,
    redirectTo: loginPath,
    isSecure,
    ...other,
  })

  server.route({
    method: ['POST', 'GET'],
    path: loginPath,
    options: {
      auth: { mode: 'try', strategy: 'session' },
      plugins: { 'hapi-auth-cookie': { redirectTo: false } },
    },
    handler: async (request, h) => {
      try {
        let errorMessage = defaultMessage
        if (request.method === 'post') {
          const { email, password } = request.payload
          const admin = await authenticate(email, password)
          if (admin) {
            request.cookieAuth.set(admin)
            return h.redirect(rootPath)
          }
          errorMessage = 'invalidCredentials'
        }

        // AdminBro exposes function which renders login form for us.
        // It takes 2 arguments:
        // - options.action (with login path)
        // - [errorMessage] optional error message - visible when user
        //                  gives wrong credentials
        return adminBro.renderLogin({ action: loginPath, errorMessage })
      } catch (e) {
        console.log(e)
        throw e
      }
    },
  })

  server.route({
    method: 'GET',
    path: logoutPath,
    options: { auth: false },
    handler: async (request, h) => {
      request.cookieAuth.clear()
      return h.redirect(loginPath)
    },
  })
}

module.exports = sessionAuth
