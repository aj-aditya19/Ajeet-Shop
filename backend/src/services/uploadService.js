const path = require('path');
const UploadedFile = require('../models/UploadedFile');
const ApiError = require('../utils/ApiError');
const { getProvider } = require('./storage');

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
// extension -> accepted MIME types + magic-byte signature
const ALLOWED = {
  pdf: { mimes: ['application/pdf'], magic: [0x25, 0x50, 0x44, 0x46] },
  jpg: { mimes: ['image/jpeg'], magic: [0xff, 0xd8, 0xff] },
  jpeg: { mimes: ['image/jpeg'], magic: [0xff, 0xd8, 0xff] },
  png: { mimes: ['image/png'], magic: [0x89, 0x50, 0x4e, 0x47] },
  doc: { mimes: ['application/msword', 'application/octet-stream'], magic: [0xd0, 0xcf, 0x11, 0xe0] },
  docx: { mimes: [DOCX, 'application/octet-stream'], magic: [0x50, 0x4b, 0x03, 0x04] },
};

const cleanName = (n) =>
  path.basename(String(n)).replace(/[^\w.\- ()\u0900-\u097F]/g, '_').slice(0, 150) || 'document';

function validateFile(file, maxBytes) {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const rule = ALLOWED[ext];
  if (!rule || !rule.mimes.includes(file.mimetype))
    throw new ApiError(422, `File type not allowed: ${file.originalname}`);
  if (file.size > maxBytes) throw new ApiError(413, `${file.originalname} is too large`);
  if (!file.buffer || !rule.magic.every((b, i) => file.buffer[i] === b))
    throw new ApiError(422, `${file.originalname} does not look like a valid ${ext.toUpperCase()} file`);
  return ext;
}

async function saveFiles(files = [], { uploadedBy, request }) {
  const provider = getProvider();
  const stored = [];
  try {
    for (const f of files) {
      const ext = validateFile(f, Number.MAX_SAFE_INTEGER);
      const { storageId, storageUrl } = await provider.upload(f.buffer, { ext });
      stored.push(storageId);
      await UploadedFile.create({
        originalName: cleanName(f.originalname),
        storageUrl,
        storageId,
        provider: provider.name,
        mimeType: f.mimetype,
        size: f.size,
        uploadedBy,
        request,
      });
    }
    return UploadedFile.find({ request }).select('_id');
  } catch (err) {
    await Promise.allSettled(stored.map((id) => provider.remove(id)));
    await UploadedFile.deleteMany({ request });
    throw err;
  }
}

async function getForDownload(user, id) {
  const file = await UploadedFile.findById(id).select('+storageUrl +storageId +provider');
  // Customers get 404 (not 403) for files they don't own, so IDs can't be probed.
  if (!file || (user.role !== 'admin' && String(file.uploadedBy) !== String(user._id)))
    throw new ApiError(404, 'File not found');
  const provider = getProvider().name === file.provider ? getProvider() : require(`./storage/${file.provider}Provider`);
  const buffer = await provider.read(file);
  return { file, buffer };
}

module.exports = { ALLOWED, validateFile, saveFiles, getForDownload };
