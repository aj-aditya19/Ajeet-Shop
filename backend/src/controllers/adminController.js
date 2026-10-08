const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const dashboardService = require('../services/dashboardService');
const customerService = require('../services/customerService');

exports.dashboard = asyncHandler(async (_req, res) => ok(res, await dashboardService.adminDashboard()));
exports.customers = asyncHandler(async (req, res) => ok(res, await customerService.list(req.query)));
exports.customer = asyncHandler(async (req, res) => ok(res, await customerService.get(req.params.id)));
