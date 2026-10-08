const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/response');
const svc = require('../services/serviceCatalogService');

const isAdmin = (req) => req.user?.role === 'admin';

exports.list = asyncHandler(async (req, res) =>
  ok(res, { items: await svc.list({ includeInactive: isAdmin(req) && req.query.all === 'true' }) }));
exports.get = asyncHandler(async (req, res) => ok(res, { service: await svc.get(req.params.id, { includeInactive: isAdmin(req) }) }));
exports.create = asyncHandler(async (req, res) => created(res, { service: await svc.create(req.body) }, 'Service created'));
exports.update = asyncHandler(async (req, res) => ok(res, { service: await svc.update(req.params.id, req.body) }, 'Service updated'));
exports.setActive = asyncHandler(async (req, res) =>
  ok(res, { service: await svc.setActive(req.params.id, req.body.active) }, req.body.active ? 'Service reactivated' : 'Service deactivated'));
exports.remove = asyncHandler(async (req, res) => ok(res, await svc.remove(req.params.id), 'Service removed or deactivated'));
