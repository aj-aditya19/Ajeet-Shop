const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.isTest,
    handler: (_req, res) => res.status(429).json({ success: false, message, errors: [] }),
  });

module.exports = {
  globalLimiter: make(15 * 60 * 1000, 600, 'Too many requests, please try again later'),
  authLimiter: make(15 * 60 * 1000, 20, 'Too many login attempts, please try again later'),
};
