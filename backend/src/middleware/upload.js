const multer = require('multer');
const path = require('path');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { ALLOWED } = require('../services/uploadService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024, files: env.maxFiles },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const rule = ALLOWED[ext];
    if (!rule || !rule.mimes.includes(file.mimetype)) {
      return cb(new ApiError(422, `File type not allowed: ${file.originalname}. Allowed: ${Object.keys(ALLOWED).join(', ')}`));
    }
    cb(null, true);
  },
});

module.exports = { uploadFiles: upload.array('files', env.maxFiles) };
