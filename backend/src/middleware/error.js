const env = require("../config/env");

const notFound = (req, _res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  err.isOperational = true;
  next(err);
};

const errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message;
  let errors = err.errors || [];

  if (
    err.name === "ValidationError" &&
    err.errors &&
    !Array.isArray(err.errors)
  ) {
    status = 422;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid identifier";
    errors = [];
  } else if (err.code === 11000) {
    status = 409;
    message = "A record with this value already exists";
    errors = Object.keys(err.keyPattern || {}).map((f) => ({
      field: f,
      message: "Already exists",
    }));
  } else if (err.name === "MulterError") {
    status = err.code === "LIMIT_FILE_SIZE" ? 413 : 422;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? `File too large (max ${env.maxFileSizeMb} MB)`
        : `Upload error: ${err.message}`;
    errors = [];
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON body";
  }

  if (status >= 500) {
    if (!env.isTest) console.error(err);
    if (env.isProd) message = "Internal server error";
  }

  const body = { success: false, message, errors };
  if (!env.isProd && status >= 500) body.stack = err.stack;
  res.status(status).json(body);
};

module.exports = { notFound, errorHandler };
