const multer = require('multer');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/response');
const studio = require('../services/photoStudioService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
      ? cb(null, true)
      : cb(new ApiError(422, 'Upload a JPG, PNG or WebP photo')),
}).single('photo');

exports.uploadPhoto = upload;

exports.process = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(422, 'Please choose a photo');
  ok(res, await studio.processPhoto(req.file.buffer), 'Photo processed');
});

exports.sheet = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(422, 'Photo is required');
  const copies = parseInt(req.body.copies, 10) || 6;
  const paper = req.body.paper === 'a4' ? 'a4' : 'letter';
  const pdf = await studio.buildSheet(req.file.buffer, { copies, paper });
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="passport-photos.pdf"', 'Content-Length': pdf.length, 'Cache-Control': 'no-store' });
  res.send(pdf);
});
