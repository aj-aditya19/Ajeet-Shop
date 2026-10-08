// Swap the storage backend by adding a provider with { name, upload, read, remove } and selecting it here.
const env = require('../../config/env');

function getProvider() {
  return env.storageProvider === 'cloudinary' ? require('./cloudinaryProvider') : require('./localProvider');
}
module.exports = { getProvider };
