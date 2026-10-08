const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

async function connectDB(uri = env.mongoUri) {
  if (!uri) throw new Error('MONGO_URI is not set');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

module.exports = { connectDB };
