const Service = require('../models/Service');
const ServiceRequest = require('../models/ServiceRequest');
const ApiError = require('../utils/ApiError');

async function list({ includeInactive }) {
  const filter = includeInactive ? {} : { active: true };
  return Service.find(filter).sort({ category: 1, name: 1 });
}

async function get(id, { includeInactive }) {
  const s = await Service.findById(id);
  if (!s || (!s.active && !includeInactive)) throw new ApiError(404, 'Service not found');
  return s;
}

const create = (data) => Service.create(data);

async function update(id, data) {
  const s = await Service.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!s) throw new ApiError(404, 'Service not found');
  return s;
}

async function setActive(id, active) {
  return update(id, { active });
}

// Services are never hard-deleted when requests reference them: they are soft-disabled instead.
async function remove(id) {
  const s = await Service.findById(id);
  if (!s) throw new ApiError(404, 'Service not found');
  const used = await ServiceRequest.exists({ service: id });
  if (used) {
    s.active = false;
    await s.save();
    return { deleted: false, service: s };
  }
  await s.deleteOne();
  return { deleted: true };
}

module.exports = { list, get, create, update, setActive, remove };
