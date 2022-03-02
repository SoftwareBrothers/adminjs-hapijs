import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const Admin = mongoose.model('Admin', AdminSchema);

export default Admin;
