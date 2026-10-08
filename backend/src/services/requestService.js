const ServiceRequest = require('../models/ServiceRequest');
const Service = require('../models/Service');
const ApiError = require('../utils/ApiError');
const { nextId } = require('../utils/idGenerator');
const { escapeRegex, isObjectId, pageParams, pagination, str } = require('../utils/query');
const uploadService = require('./uploadService');
const whatsapp = require('./whatsappService');
const email = require('./emailService');
const env = require('../config/env');

const { STATUSES } = ServiceRequest;
const TRANSITIONS = {
  pending: ['accepted', 'rejected'],
  accepted: ['in_progress', 'ready', 'completed', 'rejected'],
  in_progress: ['ready', 'completed', 'rejected'],
  ready: ['completed'],
  completed: [],
  rejected: [],
};

function validateFormData(fields, input = {}) {
  const errors = [];
  const out = {};
  for (const f of fields) {
    const raw = input[f.key];
    const empty = raw === undefined || raw === null || String(raw).trim() === '';
    if (empty) {
      if (f.required) errors.push({ field: `formData.${f.key}`, message: `${f.label} is required` });
      continue;
    }
    if (f.type === 'number') {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 100000)
        errors.push({ field: `formData.${f.key}`, message: `${f.label} must be a whole number of at least 1` });
      else out[f.key] = n;
    } else if (f.type === 'select') {
      if (!f.options.includes(String(raw)))
        errors.push({ field: `formData.${f.key}`, message: `${f.label} must be one of: ${f.options.join(', ')}` });
      else out[f.key] = String(raw);
    } else {
      out[f.key] = String(raw).trim().slice(0, f.type === 'textarea' ? 1000 : 300);
    }
  }
  if (errors.length) throw new ApiError(422, 'Invalid service details', errors);
  return out;
}

function present(doc, user) {
  const o = doc.toObject ? doc.toObject() : doc;
  const serviceName = o.service?.name || 'a service';
  o.shopWhatsappLink = whatsapp.shopLink(
    whatsapp.requestStatusMessage({ requestId: o.requestId, contact: o.contact, serviceName })
  );
  if (user?.role === 'admin') {
    o.customerWhatsappLink = whatsapp.link(
      o.contact.phone,
      whatsapp.customerMessage({ requestId: o.requestId, serviceName, status: o.status })
    );
    o.allowedTransitions = TRANSITIONS[o.status] || [];
  }
  return o;
}

const populate = (q) =>
  q
    .populate('service', 'name category')
    .populate('customer', 'name email phone')
    .populate('uploadedFiles', 'originalName mimeType size createdAt');

async function createRequest(user, input, files = []) {
  const service = await Service.findById(input.serviceId);
  if (!service || !service.active) throw new ApiError(422, 'Selected service is not available', [{ field: 'serviceId', message: 'Service unavailable' }]);
  const formData = validateFormData(service.fields, input.formData);
  const maxBytes = env.maxFileSizeMb * 1024 * 1024;
  files.forEach((f) => uploadService.validateFile(f, maxBytes));

  const doc = await ServiceRequest.create({
    requestId: await nextId('AJ'),
    customer: user._id,
    service: service._id,
    contact: { name: input.name, phone: input.phone, email: input.email },
    formData,
    additionalInstructions: input.additionalInstructions,
    contactPreference: input.contactPreference,
    statusHistory: [{ status: 'pending', by: user._id }],
  });

  try {
    if (files.length) {
      const saved = await uploadService.saveFiles(files, { uploadedBy: user._id, request: doc._id });
      doc.uploadedFiles = saved.map((f) => f._id);
      await doc.save();
    }
  } catch (err) {
    await doc.deleteOne();
    throw err;
  }

  email.notifyNewRequest(doc, service.name);
  return present(await populate(ServiceRequest.findById(doc._id)), user);
}

async function list(user, q) {
  const filter = {};
  if (user.role !== 'admin') filter.customer = user._id;
  const status = str(q.status);
  if (status && STATUSES.includes(status)) filter.status = status;
  if (isObjectId(q.service)) filter.service = q.service;
  const from = str(q.from) && new Date(q.from);
  const to = str(q.to) && new Date(q.to);
  if (from && !isNaN(from)) filter.createdAt = { ...filter.createdAt, $gte: from };
  if (to && !isNaN(to)) filter.createdAt = { ...filter.createdAt, $lte: new Date(to.getTime() + 86399999) };
  const search = str(q.search);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ requestId: rx }, { 'contact.name': rx }, { 'contact.phone': rx }, { 'contact.email': rx }];
  }
  const { page, limit, skip } = pageParams(q);
  const [items, total] = await Promise.all([
    populate(ServiceRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    ServiceRequest.countDocuments(filter),
  ]);
  return { items: items.map((d) => present(d, user)), pagination: pagination(page, limit, total) };
}

async function getOne(user, idParam) {
  const filter = isObjectId(idParam) ? { _id: idParam } : { requestId: String(idParam) };
  if (user.role !== 'admin') filter.customer = user._id; // customers only ever see their own
  const doc = await populate(ServiceRequest.findOne(filter));
  if (!doc) throw new ApiError(404, 'Request not found');
  return present(doc, user);
}

async function statusCounts(filter = {}) {
  const rows = await ServiceRequest.aggregate([{ $match: filter }, { $group: { _id: '$status', n: { $sum: 1 } } }]);
  const c = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  rows.forEach((r) => (c[r._id] = r.n));
  return {
    total: Object.values(c).reduce((a, b) => a + b, 0),
    pending: c.pending,
    inProgress: c.accepted + c.in_progress,
    ready: c.ready,
    completed: c.completed,
    rejected: c.rejected,
  };
}

async function updateStatus(admin, idParam, { status, adminMessage }) {
  const filter = isObjectId(idParam) ? { _id: idParam } : { requestId: String(idParam) };
  const doc = await ServiceRequest.findOne(filter);
  if (!doc) throw new ApiError(404, 'Request not found');
  let changed = false;
  if (status && status !== doc.status) {
    if (!TRANSITIONS[doc.status].includes(status))
      throw new ApiError(409, `Cannot change status from "${doc.status}" to "${status}"`);
    doc.status = status;
    doc.statusHistory.push({ status, by: admin._id });
    if (status === 'completed') doc.completedAt = new Date();
    changed = true;
  }
  if (adminMessage !== undefined) doc.adminMessage = adminMessage;
  await doc.save();
  const full = await populate(ServiceRequest.findById(doc._id));
  if (changed) email.notifyStatusChanged(doc, full.service?.name || 'your request');
  return present(full, admin);
}

module.exports = { createRequest, list, getOne, statusCounts, updateStatus, validateFormData, TRANSITIONS };
