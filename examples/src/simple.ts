import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname + './../../infrastructure/.env') });
import Hapi from '@hapi/hapi';
import mongoose from 'mongoose';

import AdminJS from 'adminjs';
import AdminJSMongoose from '@adminjs/mongoose';
import AdminJSPlugin from '../../src';

AdminJS.registerAdapter(AdminJSMongoose);

// loading models definition
import './mongoose/admin-model';
import './mongoose/article-model';

const start = async () => {
  try {
    const server = Hapi.server({ port: process.env.PORT || 8080 });
    const connection = await mongoose.connect(process.env.MONGO_URL || '');

    const adminJsOptions = {
      databases: [connection],
      branding: {
        companyName: 'Amazing c.o.',
      },
      rootPath: '/admin',
    };
    await server.register({
      plugin: AdminJSPlugin,
      options: adminJsOptions,
    });

    await server.start();
    console.log('Server running at:', server.info.uri);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

start();
