const asyncHandler = require("../utils/asyncHandler");
const { ok, created } = require("../utils/response");
const authService = require("../services/authService");

exports.register = asyncHandler(async (req, res) =>
  created(res, await authService.register(req.body), "Registration successful"),
);
exports.login = asyncHandler(async (req, res) =>
  ok(
    res,
    await authService.login(req.body.email, req.body.password),
    "Login successful",
  ),
);
exports.adminLogin = asyncHandler(async (req, res) =>
  ok(
    res,
    await authService.login(req.body.email, req.body.password, {
      adminOnly: true,
    }),
    "Admin login successful",
  ),
);
exports.logout = (_req, res) => ok(res, {}, "Logged out");
exports.me = (req, res) => ok(res, { user: req.user });
