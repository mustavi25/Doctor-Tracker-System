const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { protect } = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1); // correct client IP behind Next rewrites / Render / Railway
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
if (env.NODE_ENV !== 'test') app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Brute-force protection on login only
app.use(
  '/api/auth/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.NODE_ENV === 'production' ? 10 : 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Try again in 15 minutes.' },
  })
);

app.use('/api/auth', require('./routes/auth.routes'));

// Everything below requires a valid session
app.use('/api/doctors', protect, require('./routes/doctor.routes'));
app.use('/api/patients', protect, require('./routes/patient.routes'));
app.use('/api/dashboard', protect, require('./routes/dashboard.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
