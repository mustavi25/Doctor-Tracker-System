const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const notFound = (req, _res, next) =>
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  let status = err.statusCode || 500;
  let message = err.message;
  let errors = err.errors;

  if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
    errors = [{ field, message }];
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  }

  if (status >= 500) {
    console.error(err);
    if (env.NODE_ENV === 'production') message = 'Internal server error';
  }

  res.status(status).json({ message, ...(errors ? { errors } : {}) });
};

module.exports = { notFound, errorHandler };
