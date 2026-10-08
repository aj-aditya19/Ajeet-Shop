const asyncHandler = require('../utils/asyncHandler');
const uploadService = require('../services/uploadService');

exports.download = asyncHandler(async (req, res) => {
  const { file, buffer } = await uploadService.getForDownload(req.user, req.params.id);
  const safeName = encodeURIComponent(file.originalName);
  res.set({
    'Content-Type': file.mimeType,
    'Content-Disposition': `inline; filename*=UTF-8''${safeName}`,
    'Content-Length': buffer.length,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.send(buffer);
});
