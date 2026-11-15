/** Non-destructive: makes the database indexes match the schemas (drops stale, creates missing). */
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');

(async () => {
  await connectDB();
  for (const Model of [User, Doctor, Patient]) {
    const dropped = await Model.syncIndexes();
    console.log(`${Model.modelName}: ${dropped.length ? `dropped ${dropped.join(', ')}` : 'indexes already in sync'}`);
  }
  await mongoose.connection.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
