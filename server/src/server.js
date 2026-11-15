const mongoose = require('mongoose');
const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

async function start() {
  await connectDB();
  const server = app.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}`));

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
