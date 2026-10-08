const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

let mongod;
exports.app = app;
exports.api = () => request(app);

exports.connect = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};
exports.disconnect = async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};
exports.clear = async () => {
  for (const c of Object.values(mongoose.connection.collections)) await c.deleteMany({});
};

exports.registerCustomer = async (over = {}) => {
  const body = { name: 'Rahul Sharma', email: `rahul${Math.random().toString(36).slice(2, 7)}@example.com`, phone: '9876543210', password: 'Passw0rdX', ...over };
  const res = await request(app).post('/api/auth/register').send(body);
  return { res, body, token: res.body.data?.token, user: res.body.data?.user };
};
exports.createAdmin = async () => {
  const email = 'admin@test.local';
  await User.create({ name: 'Admin', email, phone: '9458344385', passwordHash: await bcrypt.hash('Admin@12345', 4), role: 'admin' });
  const res = await request(app).post('/api/auth/admin/login').send({ email, password: 'Admin@12345' });
  return res.body.data.token;
};
exports.auth = (t) => ({ Authorization: `Bearer ${t}` });
// minimal valid PDF header
exports.pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
