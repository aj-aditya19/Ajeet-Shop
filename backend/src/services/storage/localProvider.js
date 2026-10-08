const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const dir = process.env.UPLOAD_DIR || path.join(__dirname, '../../../uploads');

module.exports = {
  name: 'local',
  async upload(buffer, { ext }) {
    await fs.mkdir(dir, { recursive: true });
    const storageId = `${crypto.randomUUID()}.${ext}`;
    await fs.writeFile(path.join(dir, storageId), buffer);
    return { storageId, storageUrl: `local:${storageId}` };
  },
  async read(file) {
    return fs.readFile(path.join(dir, path.basename(file.storageId)));
  },
  async remove(storageId) {
    await fs.rm(path.join(dir, path.basename(storageId)), { force: true });
  },
};
