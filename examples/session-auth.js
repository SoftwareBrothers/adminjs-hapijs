const Hapi = require('hapi')
const mongoose = require('mongoose')
const Bcrypt = require('bcrypt')

const AdminJS = require('adminjs')
const AdminJSMongoose = require('@adminjs/mongoose')
const AdminModel = require('./mongoose/admin-model')
const AdminJSPlugin = require('../index')

AdminJS.registerAdapter(AdminJSMongoose)

/**
 * Creates first admin test@example.com:password when there are no
 * admins in the database
 * @ignore
 */
const createAdminIfNone = async () => {
  const existingAdmin = await AdminModel.countDocuments() > 0
  if (!existingAdmin) {
    const password = await Bcrypt.hash('password', 10)
    const admin = new AdminModel({ email: 'test@example.com', password })
    await admin.save()
  }
}

const start = async () => {
  try {
    const server = Hapi.server({ port: process.env.PORT || 8080 })
    const connection = await mongoose.connect(process.env.MONGO_URL)

    await createAdminIfNone()

    const adminJsOptions = {
      databases: [connection],
      branding: {
        companyName: 'Amazing c.o.',
      },
      rootPath: '/admin',
      auth: {
        authenticate: async (email, password) => {
          const admin = await AdminModel.findOne({ email })
          const isValid = admin && await Bcrypt.compare(password, admin.password)
          return isValid && admin
        },
        cookiePassword: process.env.ADMIN_COOKIE_SECRET || 'yoursupersecretcookiepassword-veryveryverylong',
        isSecure: false, // allows you to test the app with http
      },
    }
    await server.register({
      plugin: AdminJSPlugin,
      options: adminJsOptions,
    })

    await server.start()
    console.log('Server running at:', server.info.uri)
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

start()
