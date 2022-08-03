import AdminJS from 'adminjs';
import Hapi from '@hapi/hapi';
import HapiAuthCookie from '@hapi/cookie';
import { ExtendedAdminJSOptionsWithDefault } from './../plugin';

interface AuthRequestPayload {
  email: string;
  password: string;
}

/**
 * Creates authentication logic for admin users
 */
const sessionAuth = async (server: Hapi.Server, adminJs: AdminJS) => {
  const options = adminJs.options as ExtendedAdminJSOptionsWithDefault;
  const { loginPath, logoutPath, rootPath } = options;
  const {
    cookiePassword,
    authenticate,
    isSecure,
    defaultMessage,
    cookieName,
    strategy = 'simple',
    ...other
  } = options.auth;

  if (!authenticate) {
    throw new Error('"authenticate" function must be provided for authenticated access');
  }

  // example authentication is based on the cookie store
  await server.register(HapiAuthCookie);

  server.auth.strategy(strategy, 'cookie', {
    cookie: {
      name: cookieName,
      password: cookiePassword,
      isSecure,
    },
    redirectTo: loginPath,
    ...other,
  });

  server.route({
    method: ['POST', 'GET'],
    path: loginPath,
    options: {
      auth: { mode: 'try', strategy: 'session' },
      plugins: { 'hapi-auth-cookie': { redirectTo: false } },
    },
    handler: async (request, h) => {
      try {
        let errorMessage = defaultMessage;
        if (request.method === 'post') {
          const { email, password } = request.payload as AuthRequestPayload;
          const admin = await authenticate(email, password);
          if (admin) {
            request.cookieAuth.set(admin);
            return h.redirect(rootPath);
          }
          errorMessage = 'invalidCredentials';
        }

        // AdminJS exposes function which renders login form for us.
        // It takes 2 arguments:
        // - options.action (with login path)
        // - [errorMessage] optional error message - visible when user
        //                  gives wrong credentials
        return adminJs.renderLogin({ action: loginPath, errorMessage });
      } catch (e) {
        console.log(e);
        throw e;
      }
    },
  });

  server.route({
    method: 'GET',
    path: logoutPath,
    options: { auth: false },
    handler: async (request, h) => {
      request.cookieAuth.clear();
      return h.redirect(loginPath);
    },
  });
};

export default sessionAuth;
