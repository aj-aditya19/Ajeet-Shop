const { z, objectId, phone, date } = require('./common');

exports.equipmentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.enum(['bhati', 'chari', 'kadai', 'patila', 'other']).default('other'),
  description: z.string().trim().max(500).default(''),
  imageUrl: z.string().trim().url().or(z.literal('')).default(''),
  totalQuantity: z.coerce.number().int().min(0),
  defaultRate: z.coerce.number().min(0),
  active: z.boolean().default(true),
  showAvailability: z.boolean().default(false),
});

const item = z.object({
  equipment: objectId,
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  rate: z.coerce.number().min(0).optional(), // defaults to the equipment's default rate
});

exports.rentalSchema = z
  .object({
    customerName: z.string().trim().min(2).max(100),
    phone,
    address: z.string().trim().max(300).default(''),
    items: z.array(item).min(1, 'Add at least one item').max(30),
    rentalDate: date,
    dueDate: date,
    notes: z.string().trim().max(500).default(''),
    discount: z.coerce.number().min(0).default(0),
    advancePaid: z.coerce.number().min(0).default(0),
  })
  .refine((v) => v.dueDate >= new Date(new Date(v.rentalDate).setHours(0, 0, 0, 0)), {
    path: ['dueDate'],
    message: 'Due date cannot be before the rental date',
  });
