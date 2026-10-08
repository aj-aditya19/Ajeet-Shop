const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const signToken = (user) => jwt.sign({ sub: String(user._id) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

async function register({ name, email, phone, password }) {
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');
  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  // Role is always "customer" here; admins are only created via the seed script.
  const user = await User.create({ name, email, phone, passwordHash, role: 'customer' });
  return { user, token: signToken(user) };
}

async function login(email, password, { adminOnly = false } = {}) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  const roleOk = user && (adminOnly ? user.role === 'admin' : user.role === 'customer');
  if (!valid || !roleOk) throw new ApiError(401, 'Invalid email or password');
  return { user, token: signToken(user) };
}

module.exports = { register, login, signToken };
