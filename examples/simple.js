const Hapi = require('hapi')
const mongoose = require('mongoose')

const AdminBro = require('admin-bro')
const AdminBroMongoose = require('admin-bro-mongoose')
const AdminBroPlugin = require('../index')

AdminBro.registerAdapter(AdminBroMongoose)

// loading models definition
require('./mongoose/admin-model')
require('./mongoose/article-model')

const start = async () => {
  try {
    const server = Hapi.server({ port: process.env.PORT || 8080 })
    const connection = await mongoose.connect(process.env.MONGO_URL)

    const adminBroOptions = {
      databases: [connection],
      branding: {
        companyName: 'Amazing c.o.',
      },
      rootPath: '/admin',
    }
    await server.register({
      plugin: AdminBroPlugin,
      options: adminBroOptions,
    })

    await server.start()
    console.log('Server running at:', server.info.uri)
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

start()
