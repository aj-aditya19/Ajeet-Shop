const { z, objectId, phone } = require('./common');
const { STATUSES } = require('../models/ServiceRequest');

const jsonObject = z.preprocess((v) => {
  if (v === undefined || v === '') return {};
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
  return v;
}, z.record(z.any(), { invalid_type_error: 'formData must be a JSON object' }));

exports.createRequestSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  phone,
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  serviceId: objectId,
  additionalInstructions: z.string().trim().max(1000).default(''),
  contactPreference: z.enum(['call', 'whatsapp', 'email']).default('whatsapp'),
  formData: jsonObject,
});

exports.statusUpdateSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    adminMessage: z.string().trim().max(1000).optional(),
  })
  .refine((v) => v.status !== undefined || v.adminMessage !== undefined, 'Provide a status or an admin message');
