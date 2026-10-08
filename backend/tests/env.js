process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-1234';
process.env.BCRYPT_ROUNDS = '4';
process.env.STORAGE_PROVIDER = 'local';
process.env.UPLOAD_DIR = require('os').tmpdir() + '/ajeet-test-uploads';
process.env.TZ = 'Asia/Kolkata';
