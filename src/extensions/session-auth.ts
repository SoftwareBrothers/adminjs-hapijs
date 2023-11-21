import HapiAuthCookie from '@hapi/cookie';
import Hapi from '@hapi/hapi';
import AdminJS from 'adminjs';

import { ExtendedAdminJSOptionsWithDefault } from '../plugin.js';

interface AuthRequestPayload {
  email: string;
  password: string;
}

const MISSING_PROVIDER_ERROR = '"provider" has to be configured to use refresh token mechanism';

/**
 * Creates authentication logic for admin users
 */
const sessionAuth = async (server: Hapi.Server, adminJs: AdminJS) => {
  const options = adminJs.options as ExtendedAdminJSOptionsWithDefault;
  const { loginPath, logoutPath, refreshTokenPath, rootPath } = options;
  const {
    cookiePassword,
    authenticate,
    provider,
    isSecure,
    defaultMessage,
    cookieName,
    strategy = 'simple',
    ...other
  } = options.auth;

  if (!authenticate && !provider) {
    throw new Error('"authenticate" or "provider" must be configured for authenticated access');
  }

  const providerProps = provider ? provider.getUiProps() : {};

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
      plugins: { cookie: { redirectTo: false } },
    },
    handler: async (request, h) => {
      try {
        let errorMessage = defaultMessage as string;
        if (request.method === 'post') {
          const ctx = { request, h };
          let adminUser;
          if (provider) {
            adminUser = await provider.handleLogin(
              {
                headers: request.headers,
                query: request.query,
                params: request.params,
                data: (request.payload as Record<string, unknown>) ?? {},
              },
              ctx
            );
          } else {
            const { email, password } = request.payload as AuthRequestPayload;
            adminUser = await authenticate!(email, password, ctx);
          }

          if (adminUser) {
            request.cookieAuth.set(adminUser);
            return h.redirect(rootPath);
          }
          errorMessage = 'invalidCredentials';
        }

        const baseProps = { action: loginPath, errorMessage };
        return adminJs.renderLogin({ ...baseProps, ...providerProps });
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
      if (provider) {
        await provider.handleLogout({
          headers: request.headers,
          query: request.query,
          params: request.params,
          data: (request.payload as Record<string, unknown>) ?? {},
        });
      }
      request.cookieAuth.clear();
      return h.redirect(loginPath);
    },
  });

  server.route({
    method: 'POST',
    path: refreshTokenPath,
    options: {
      auth: { mode: 'try', strategy: 'session' },
      plugins: { cookie: { redirectTo: false } },
    },
    handler: async (request, h) => {
      if (!provider) {
        throw new Error(MISSING_PROVIDER_ERROR);
      }

      const updatedAuthInfo = await provider.handleRefreshToken(
        {
          data: (request.payload as Record<string, unknown>) ?? {},
          query: request.query,
          params: request.params,
          headers: request.headers,
        },
        { request, h }
      );

      let adminObject = Array.isArray(request.auth?.credentials)
        ? request.auth?.credentials?.[0]
        : request.auth?.credentials;

      if (!adminObject) {
        adminObject = {};
      }

      if (!adminObject._auth) {
        adminObject._auth = {};
      }

      adminObject._auth = {
        ...adminObject._auth,
        ...updatedAuthInfo,
      };

      request.cookieAuth.set(adminObject);
      return h.response(adminObject);
    },
  });
};

export default sessionAuth;
