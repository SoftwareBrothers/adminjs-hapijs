# Hapijs plugin for AdminBro

This is an official [AdminBro](https://github.com/SoftwareBrothers/admin-bro) plugin which integrates it to [hapijs](https://hapijs.com/) framework.

## AdminBro

AdminBro is an automatic admin interface which can be plugged into your application. You, as a developer, provide database models (like posts, comments, stores, products or whatever else your application uses), and AdminBro generates UI which allows you (or other trusted users) to manage content.

Check out the example application with mongo and postgres models here: https://admin-bro-example-app.herokuapp.com/admin

Or visit [AdminBro](https://github.com/SoftwareBrothers/admin-bro) github page.

## Dependencies

Plugin depends on the following packages and they have to be installed:

* boom
* inert

And, if you want to use built-in auth:

* hapi-auth-cookie

## Usage

The plugin can be registered using standard `server.register` method.

### The simplest example

```javascript
const AdminBroPlugin = require('admin-bro-hapijs')
const Hapi = require('hapi')

// check out AdminBro documentation about setting up the database.
const yourDatabase = require('your-database-setup-file')

// check out AdminBro documentation to see all possible options.
const adminBroOptions = {
  branding: {
    companyName: 'Amazing c.o.',
  },
  resources: [yourDatabase],
}

const server = Hapi.server({ port: process.env.PORT || 8080 })
const start = async () => {
  await server.register({
    plugin: AdminBroPlugin,
    options: adminBroOptions,
  })

  await server.start()
}

start()
```

The example above will launch the admin panel under default `localhost:8080/admin` url. Routes will be accessible by all users without any authentication.

To restrict access you can pass `auth` via plugin options.

### Authentication options

Plugin receives all [available AdminBro options](https://softwarebrothers.github.io/admin-bro/global.html#AdminBroOptions) and one special parameter: `auth` which controls the authentication.

1. By default, if you won't give `options.auth` - admin panel will be available without the authentication (like in the simplest example above)
2. You can set whatever authentication you prefer for admin routes by setting `options.auth.strategy`. For example:

```javascript
//...
await server.register(require('hapi-auth-basic'))
server.auth.strategy('simple', 'basic', { validate })

await server.register({
  plugin: AdminBroPlugin,
  options: { auth: { strategy: 'simple' } },
})
//...
```

The strategy will be passed down to all AdminBro routes.

3. admin-bro-hapijs plugin can be setup to use [auth-cookie](https://github.com/hapijs/hapi-auth-cookie). Only thing you have to do is to define following auth options:

* options.auth.authenticate: function which takes an `email` and `password` as parameters and returns authenticated user or `null` in case of wrong email/password
* options.auth.cookiePassword - password used to encrypt cookies
* options.auth.isSecure - whether only https requests should be allowed
* options.auth.cookieName - name for the cookie

### Example with an authentication

```javascript
const AdminBroPlugin = require('admin-bro-hapijs')
const Hapi = require('hapi')

// see AdminBro documentation about setting up the database.
const yourDatabase = require('your-database-setup-file')

const ADMIN = {
  email: 'text@example.com',
  password: 'password',
}

const adminBroOptions = {
  resources: [yourDatabase],

  auth: {
    authenticate: (email, password) => {
      if (ADMIN.email === email && ADMIN.password === password) {
        return ADMIN
      }
      return null
    },
    strategy: 'session',
    cookieName: 'adminBroCookie',
    cookiePassword: process.env.COOKIE_PASSWORD || 'makesurepasswordissecure',
    isSecure: true, //only https requests
  },
}

const server = Hapi.server({ port: process.env.PORT || 8080 })
const start = async () => {
  await server.register({
    plugin: AdminBroPlugin,
    options: adminBroOptions,
  })

  await server.start()
}

start()
```

### Extras

If you would like to implement other auth strategy but want to use default design of the login page you can render it.

```
const action = '/admin/login'
const errorMessage = 'There was a problem with your login and/or password'

const htmlPage = await AdminBroPlugin.renderLogin({ action, errorMessage })
```

## Other examples

In examples folder we prepared 2 working examples:
* [simplest integration with mongodb database](examples/simple.js)
* [integration with cookie auth](examples/session-auth.js)

You can run one of them by typing:
(assume you have mongodbe running on port `27017`)

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