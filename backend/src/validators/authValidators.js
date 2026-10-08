const { z, phone } = require('./common');

const email = z.string().trim().toLowerCase().email('Enter a valid email').max(150);

exports.registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(100),
  email,
  phone,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72)
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/\d/, 'Password must contain a number'),
});

exports.loginSchema = z.object({ email, password: z.string().min(1, 'Password is required').max(72) });
