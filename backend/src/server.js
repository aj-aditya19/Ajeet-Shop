const env = require('./config/env');
const { connectDB } = require('./config/db');

function assertConfig() {
  const missing = [];
  if (!env.mongoUri) missing.push('MONGO_URI');
  if (!env.jwtSecret) missing.push('JWT_SECRET');
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')} (see backend/.env.example)`);
  if (env.isProd && env.jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production');
  if (env.storageProvider === 'local' && env.isProd)
    console.warn('[storage] Using local disk storage in production. Configure Cloudinary for persistent uploads.');
}

(async () => {
  try {
    assertConfig();
    await connectDB();
    const app = require('./app');
    app.listen(env.port, () => console.log(`API listening on :${env.port} (${env.nodeEnv}, storage: ${env.storageProvider})`));
    require('./services/overdueAlertService').start();
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();
