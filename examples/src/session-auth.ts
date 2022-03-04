import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname + './../../infrastructure/.env') });
import Hapi from '@hapi/hapi';
import inert from '@hapi/inert';
import mongoose from 'mongoose';
import Bcrypt from 'bcrypt';
import AdminJS from 'adminjs';
import AdminJSMongoose from '@adminjs/mongoose';
import AdminModel from './mongoose/admin-model';
import AdminJSPlugin from '../../src';

AdminJS.registerAdapter(AdminJSMongoose);

/**
 * Creates first admin test@example.com:password when there are no
 * admins in the database
 * @ignore
 */
const createAdminIfNone = async () => {
  const existingAdmin = (await AdminModel.countDocuments()) > 0;
  if (!existingAdmin) {
    const password = await Bcrypt.hash('password', 10);
    const admin = new AdminModel({ email: 'test@example.com', password });
    await admin.save();
  }
};

const start = async () => {
  try {
    const server = Hapi.server({ port: process.env.PORT || 8080 });
    const connection = await mongoose.connect(process.env.MONGO_URL || '');

    await createAdminIfNone();

    const adminJsOptions = {
      databases: [connection],
      branding: {
        companyName: 'Amazing c.o.',
      },
      rootPath: '/admin',
      registerInert: false,
      auth: {
        authenticate: async (email, password) => {
          const admin = await AdminModel.findOne({ email });
          const isValid = admin && (await Bcrypt.compare(password, admin.password));
          return isValid && admin;
        },
        cookiePassword: process.env.ADMIN_COOKIE_SECRET || 'yoursupersecretcookiepassword-veryveryverylong',
        isSecure: false, // allows you to test the app with http
      },
    };
    await server.register(inert);
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
