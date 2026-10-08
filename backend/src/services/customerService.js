const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const ApiError = require('../utils/ApiError');
const { escapeRegex, isObjectId, pageParams, pagination, str } = require('../utils/query');

async function list(q) {
  const { page, limit, skip } = pageParams(q);
  const match = { role: 'customer' };
  const search = str(q.search);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    match.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(match),
  ]);
  const reqs = await ServiceRequest.find({ customer: { $in: users.map((u) => u._id) } })
    .select('customer createdAt').lean();
  const byId = new Map();
  for (const r of reqs) {
    const k = String(r.customer);
    const cur = byId.get(k) || { total: 0, last: null };
    cur.total += 1;
    if (!cur.last || r.createdAt > cur.last) cur.last = r.createdAt;
    byId.set(k, cur);
  }
  const items = users.map((u) => ({
    _id: u._id, name: u.name, email: u.email, phone: u.phone, createdAt: u.createdAt,
    totalRequests: byId.get(String(u._id))?.total || 0,
    lastRequestAt: byId.get(String(u._id))?.last || null,
  }));
  return { items, pagination: pagination(page, limit, total) };
}

async function get(id) {
  if (!isObjectId(id)) throw new ApiError(400, 'Invalid identifier');
  const user = await User.findOne({ _id: id, role: 'customer' });
  if (!user) throw new ApiError(404, 'Customer not found');
  const requests = await ServiceRequest.find({ customer: id })
    .sort({ createdAt: -1 })
    .populate('service', 'name category')
    .select('requestId service status createdAt');
  return { customer: user, requests };
}

module.exports = { list, get };
