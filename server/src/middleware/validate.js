const ApiError = require('../utils/ApiError');

// validate({ params, query, body }) -> parsed values land in req.validated
// (Express 5 makes req.query read-only, so we never overwrite it.)
module.exports = (schemas) => (req, _res, next) => {
  const errors = [];
  req.validated = {};

  for (const key of ['params', 'query', 'body']) {
    if (!schemas[key]) continue;
    const result = schemas[key].safeParse(req[key] ?? {});
    if (!result.success) {
      result.error.issues.forEach((i) =>
        errors.push({ in: key, field: i.path.join('.'), message: i.message })
      );
    } else {
      req.validated[key] = result.data; // unknown keys are stripped
    }
  }

  if (errors.length) return next(new ApiError(400, 'Validation failed', errors));
  next();
};
