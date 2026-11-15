const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { COOKIE_NAME } = require('../middleware/auth');

const cookieOptions = {
  httpOnly: true, // JS can't read it -> protects against XSS token theft
  sameSite: 'lax', // blocks cross-site POSTs -> CSRF protection
  secure: env.NODE_ENV === 'production',
  path: '/',
};
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email }).select('+password');

  // Same message for unknown email and wrong password (no user enumeration)
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: env.JWT_EXPIRES_IN,
  });

  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: MAX_AGE_MS });
  res.json({ user: publicUser(user) });
});

exports.logout = (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ message: 'Logged out' });
};

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) throw new ApiError(401, 'User no longer exists');
  res.json({ user: publicUser(user) });
});
