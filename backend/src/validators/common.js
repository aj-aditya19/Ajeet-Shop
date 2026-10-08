const { z } = require('zod');
const { isValidIndianMobile, normalizePhone } = require('../utils/phone');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const phone = z.string().trim().refine(isValidIndianMobile, 'Enter a valid 10-digit Indian mobile number').transform(normalizePhone);
const date = z.coerce.date({ invalid_type_error: 'Invalid date', required_error: 'Date is required' });

module.exports = { z, objectId, phone, date };
