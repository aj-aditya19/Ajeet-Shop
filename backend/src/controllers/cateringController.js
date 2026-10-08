const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/response');
const rentals = require('../services/rentalService');
const alerts = require('../services/overdueAlertService');

exports.publicEquipment = asyncHandler(async (_req, res) => ok(res, { items: await rentals.publicEquipment() }));
exports.listEquipment = asyncHandler(async (_req, res) => ok(res, { items: await rentals.listEquipment() }));
exports.createEquipment = asyncHandler(async (req, res) =>
  created(res, { equipment: await rentals.saveEquipment(req.body) }, 'Equipment added'));
exports.updateEquipment = asyncHandler(async (req, res) =>
  ok(res, { equipment: await rentals.saveEquipment(req.body, req.params.id) }, 'Equipment updated'));
exports.deactivateEquipment = asyncHandler(async (req, res) =>
  ok(res, { equipment: await rentals.deactivateEquipment(req.params.id) }, 'Equipment deactivated'));

exports.dashboard = asyncHandler(async (_req, res) => ok(res, await rentals.dashboard()));
exports.clients = asyncHandler(async (_req, res) => ok(res, { items: await rentals.clients() }));
exports.reports = asyncHandler(async (req, res) => ok(res, await rentals.reports({ from: req.query.from, to: req.query.to })));

exports.listRentals = asyncHandler(async (req, res) => ok(res, await rentals.listRentals(req.query)));
exports.getRental = asyncHandler(async (req, res) => ok(res, { rental: await rentals.getRental(req.params.id) }));
exports.createRental = asyncHandler(async (req, res) =>
  created(res, { rental: await rentals.createRental(req.user, req.body) }, 'Rental created'));
exports.updateRental = asyncHandler(async (req, res) =>
  ok(res, { rental: await rentals.updateRental(req.params.id, req.body) }, 'Rental updated'));
exports.returnRental = asyncHandler(async (req, res) => ok(res, { rental: await rentals.markReturned(req.params.id) }, 'Rental marked as returned'));
exports.cancelRental = asyncHandler(async (req, res) => ok(res, { rental: await rentals.cancelRental(req.params.id) }, 'Rental cancelled'));

exports.alerts = asyncHandler(async (_req, res) => {
  const list = await rentals.listRentals({ status: 'overdue', limit: '100' });
  ok(res, { overdue: list.items, channels: alerts.channels() });
});
exports.sendAlertsNow = asyncHandler(async (_req, res) => ok(res, { result: await alerts.runOnce({ force: true }), channels: alerts.channels() }, 'Alert sent'));
