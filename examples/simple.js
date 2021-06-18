const Hapi = require('hapi')
const mongoose = require('mongoose')

const AdminJS = require('adminjs')
const AdminJSMongoose = require('@adminjs/mongoose')
const AdminJSPlugin = require('../index')

AdminJS.registerAdapter(AdminJSMongoose)

// loading models definition
require('./mongoose/admin-model')
require('./mongoose/article-model')

const start = async () => {
  try {
    const server = Hapi.server({ port: process.env.PORT || 8080 })
    const connection = await mongoose.connect(process.env.MONGO_URL)

    const adminJsOptions = {
      databases: [connection],
      branding: {
        companyName: 'Amazing c.o.',
      },
      rootPath: '/admin',
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
