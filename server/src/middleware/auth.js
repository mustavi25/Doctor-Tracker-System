const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const COOKIE_NAME = 'token';

function protect(req, _res, next) {
  const header = req.headers.authorization;
  const token = req.cookies?.[COOKIE_NAME] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return next(new ApiError(401, 'Not authenticated'));

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, 'Session expired or invalid'));
  }
}

const authorize = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(new ApiError(403, 'Forbidden'));

module.exports = { protect, authorize, COOKIE_NAME };
