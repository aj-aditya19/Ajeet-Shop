const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

async function resolveUser(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  let payload;
  try {
    payload = jwt.verify(header.slice(7), env.jwtSecret);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, "Account no longer exists");
  return user;
}

const authenticate = asyncHandler(async (req, _res, next) => {
  const user = await resolveUser(req);
  if (!user) throw new ApiError(401, "Authentication required");
  req.user = user;
  next();
});

const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = (await resolveUser(req)) || undefined;
  next();
});

const requireAdmin = (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, "Authentication required"));
  if (req.user.role !== "admin")
    return next(new ApiError(403, "Admin access required"));
  next();
};

module.exports = { authenticate, optionalAuth, requireAdmin };
