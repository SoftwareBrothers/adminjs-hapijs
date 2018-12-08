# Hapijs plugin for AdminBro

This is an official [AdminBro](https://github.com/SoftwareBrothers/admin-bro) plugin which integrates it to [hapijs](https://hapijs.com/) framework.

## Usage

The plugin can be registered using standard `server.register` method.

```javascript
const AdminBroPlugin = require('admin-bro-hapijs')

const standardAdminBroOptions = {
  branding: {
    companyName: 'Amazing c.o.',
  },
  resources: [...]
  // ...and other options
}

const adminBroOptions = {
  auth: {
    authenticate: (email, password) => {
      // authenticate admin user here
      return admin // or null
    },
    strategy: 'session',
    cookieName: 'adminBroCookie',
    cookiePassword: params.env.COOKIE_PASSWORD || 'makesurepasswordissecure',
    isSecure: true, //only https requests
  }
  ...standardAdminBroOptions,
}

await server.register({
  plugin: AdminBroPlugin,
  options: adminBroOptions,
})
```

To see all standard admin-bro options - please visit: https://github.com/SoftwareBrothers/admin-bro project.

### Word about the authentication

There are a couple of things worth notice when setting up an authentication for you AdminBro routes:

1. By default, if you won't give `options.auth` - admin panel will be available without the authentication.
2. You can set whatever authentication you prefer for admin routes by setting `options.auth.strategy`. For example:

```javascript
...
await server.register(require('hapi-auth-basic'))
server.auth.strategy('simple', 'basic', { validate })

await server.register({
  plugin: AdminBroPlugin,
  options: { auth: { strategy: 'simple' } },
})
...

```

3. admin-bro-hapijs plugin can be setup to use [auth-cookie](https://github.com/hapijs/hapi-auth-cookie). Only thing you have to do is to setup:
* options.auth.authenticate
* options.auth.cookiePassword
* options.auth.isSecure.

4. There is a helper method for rendering the login page:

```javascript
const action = '/admin/login'
const errorMessage = 'There was a problem with your login and/or password'

const htmlPage = await AdminBroPlugin.renderLogin({ action, errorMessage })
```

## Examples

In examples folder we prepared 2 working examples:
* [simplest integration with mongodb database](examples/simple.js)
* [integration with cookie auth](examples/session-auth.js)

You can run one of them by typing:

```bash
PORT=8080 MONGO_URL=mongodb://localhost:27017/yourserver node examples/simple.js
```

and then visit `http://localhost:8080/admin`


## License

AdminBro is Copyright © 2018 SoftwareBrothers.co. It is free software and may be redistributed under the terms specified in the [LICENSE](LICENSE) file.

## About SoftwareBrothers.co

<img src="https://softwarebrothers.co/assets/images/software-brothers-logo-full.svg" width=240>


We’re an open, friendly team that helps clients from all over the world to transform their businesses and create astonishing products.

* We are available to [hire](https://softwarebrothers.co/contact).
* If you want to work for us - check out the [career page](https://softwarebrothers.co/career).