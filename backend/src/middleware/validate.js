const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    const err = new Error('Validation failed');
    err.status = 422;
    err.errors = errors;
    err.isOperational = true;
    return next(err);
  }
  req[source] = result.data;
  next();
};
module.exports = validate;
