const { z } = require('./common');

const field = z.object({
  key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/, 'Field key must be alphanumeric, starting with a letter'),
  label: z.string().trim().min(1).max(80),
  type: z.enum(['text', 'number', 'select', 'textarea']).default('text'),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1)).default([]),
});

const base = {
  name: z.string().trim().min(2).max(100),
  category: z.enum(['printing', 'digital', 'other']),
  description: z.string().trim().max(500).default(''),
  active: z.boolean().default(true),
  fields: z.array(field).max(15).default([]),
};

exports.serviceSchema = z.object(base).superRefine((v, ctx) => {
  const keys = new Set();
  v.fields.forEach((f, i) => {
    if (keys.has(f.key)) ctx.addIssue({ code: 'custom', path: ['fields', i, 'key'], message: 'Duplicate field key' });
    keys.add(f.key);
    if (f.type === 'select' && f.options.length === 0)
      ctx.addIssue({ code: 'custom', path: ['fields', i, 'options'], message: 'Select fields need options' });
  });
});
exports.activeSchema = z.object({ active: z.boolean() });
