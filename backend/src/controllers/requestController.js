const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/response');
const requestService = require('../services/requestService');

exports.create = asyncHandler(async (req, res) =>
  created(res, { request: await requestService.createRequest(req.user, req.body, req.files) }, 'Request created successfully'));
exports.list = asyncHandler(async (req, res) => ok(res, await requestService.list(req.user, req.query)));
exports.stats = asyncHandler(async (req, res) => ok(res, await requestService.statusCounts({ customer: req.user._id })));
exports.get = asyncHandler(async (req, res) => ok(res, { request: await requestService.getOne(req.user, req.params.id) }));
exports.updateStatus = asyncHandler(async (req, res) =>
  ok(res, { request: await requestService.updateStatus(req.user, req.params.id, req.body) }, 'Request updated'));
