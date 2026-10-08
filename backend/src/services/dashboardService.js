const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const requestService = require('./requestService');
const rentalService = require('./rentalService');

async function adminDashboard() {
  await rentalService.syncStatuses();
  const CateringRental = require('../models/CateringRental');
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [counts, newRequests, totalCustomers, activeRentals, overdueRentals, recent] = await Promise.all([
    requestService.statusCounts(),
    ServiceRequest.countDocuments({ status: 'pending', createdAt: { $gte: since } }),
    User.countDocuments({ role: 'customer' }),
    CateringRental.countDocuments({ returnDate: null, status: { $in: rentalService.OPEN } }),
    CateringRental.countDocuments({ status: 'overdue' }),
    ServiceRequest.find().sort({ createdAt: -1 }).limit(8).populate('service', 'name').select('requestId contact service status createdAt'),
  ]);
  return {
    newRequests, pending: counts.pending, inProgress: counts.inProgress, ready: counts.ready,
    completed: counts.completed, totalRequests: counts.total, totalCustomers, activeRentals, overdueRentals,
    recentRequests: recent,
  };
}

module.exports = { adminDashboard };
