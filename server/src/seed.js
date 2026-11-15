const mongoose = require('mongoose');
const env = require('./config/env');
const connectDB = require('./config/db');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');

const DAY = 24 * 60 * 60 * 1000;
const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const daysAgo = (max) => new Date(Date.now() - rand(max * DAY) - rand(DAY));
const phone = () => `+8801${pick([3, 5, 7, 8, 9])}${String(rand(1e8)).padStart(8, '0')}`;

const DOCTORS = [
  ['Dr. Ayesha Rahman', 'Cardiology', 'Square Hospital'],
  ['Dr. Tanvir Hossain', 'Neurology', 'United Hospital'],
  ['Dr. Nusrat Jahan', 'Pediatrics', 'Evercare Hospital'],
  ['Dr. Imran Chowdhury', 'Orthopedics', 'Labaid Hospital'],
  ['Dr. Sadia Karim', 'Dermatology', 'Popular Hospital'],
  ['Dr. Rafiq Ahmed', 'Cardiology', 'United Hospital'],
  ['Dr. Farhana Islam', 'Gynecology', 'Square Hospital'],
  ['Dr. Mahmudul Hasan', 'Oncology', 'Evercare Hospital'],
  ['Dr. Shirin Akter', 'Endocrinology', 'Labaid Hospital'],
  ['Dr. Kamal Uddin', 'Pulmonology', 'Popular Hospital'],
  ['Dr. Lamia Sultana', 'Psychiatry', 'Square Hospital'],
  ['Dr. Zahid Alam', 'Gastroenterology', 'United Hospital'],
];
const CONDITIONS = ['Hypertension', 'Diabetes', 'Asthma', 'Migraine', 'Arthritis', 'Anxiety', 'Fracture', 'Allergy', 'Fever', 'Back Pain'];
const FIRST = ['Rahim', 'Karim', 'Sumaiya', 'Nabil', 'Tania', 'Arif', 'Mim', 'Sakib', 'Rima', 'Fahim', 'Joya', 'Asif', 'Nila', 'Rashed', 'Mitu'];
const LAST = ['Khan', 'Ahmed', 'Begum', 'Hossain', 'Akter', 'Islam', 'Sarker', 'Mia', 'Roy', 'Das'];

const BULK = process.argv.includes('--bulk');
const EXTRA_SPECS = ['Urology', 'Ophthalmology', 'ENT', 'Radiology', 'Nephrology', 'Rheumatology', 'Hematology', 'General Surgery'];
const EXTRA_HOSPITALS = ['Apollo Hospital', 'Ibn Sina Hospital', 'BSMMU', 'Dhaka Medical College', 'Ad-din Hospital', 'Samorita Hospital'];

/** --bulk: 200 doctors / ~20,000 patients, so index behaviour is visible in `npm run explain` */
async function seedBulk() {
  const specs = [...new Set([...DOCTORS.map((d) => d[1]), ...EXTRA_SPECS])];
  const hospitals = [...new Set([...DOCTORS.map((d) => d[2]), ...EXTRA_HOSPITALS])];
  const docs = Array.from({ length: 200 }, (_, i) => ({
    name: `Dr. ${pick(FIRST)} ${pick(LAST)} ${i + 1}`,
    specialization: pick(specs),
    hospital: pick(hospitals),
    phone: phone(),
    email: `doctor${i + 1}@bulk.doctortracker.com`,
    createdAt: daysAgo(180),
    updatedAt: new Date(),
  }));
  const doctors = await Doctor.insertMany(docs);

  let total = 0;
  for (let i = 0; i < doctors.length; i++) {
    const doc = doctors[i];
    const n = 20 + rand(160);
    const batch = Array.from({ length: n }, () => {
      const createdAt = new Date(Math.max(doc.createdAt.getTime(), Date.now() - rand(120 * DAY)));
      return { name: `${pick(FIRST)} ${pick(LAST)}`, age: 1 + rand(90), gender: pick(['male', 'female', 'other']), phone: phone(), condition: pick(CONDITIONS), doctor: doc._id, createdAt, updatedAt: createdAt };
    });
    await Patient.insertMany(batch, { ordered: false });
    total += n;
  }
  return { doctors: doctors.length, patients: total };
}

async function seed() {
  await connectDB();
  // syncIndexes drops indexes no longer in the schema and creates the missing ones
  await Promise.all([User.syncIndexes(), Doctor.syncIndexes(), Patient.syncIndexes()]);

  await Promise.all([User.deleteMany({}), Doctor.deleteMany({}), Patient.deleteMany({})]);

  await User.create({ name: 'Admin', email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });

  if (BULK) {
    const r = await seedBulk();
    console.log(`Bulk seeded: 1 admin, ${r.doctors} doctors, ${r.patients} patients`);
    console.log(`Login -> ${env.ADMIN_EMAIL} / ${env.ADMIN_PASSWORD}`);
    await mongoose.connection.close();
    return;
  }

  const doctors = await Doctor.insertMany(
    DOCTORS.map(([name, specialization, hospital], i) => ({
      name,
      specialization,
      hospital,
      phone: phone(),
      email: `${name.replace(/^Dr\.\s/, '').toLowerCase().replace(/\s+/g, '.')}@doctortracker.com`,
      createdAt: daysAgo(90),
      updatedAt: new Date(),
    }))
  );

  const patients = [];
  doctors.forEach((doc) => {
    const n = 6 + rand(14);
    for (let i = 0; i < n; i++) {
      const createdAt = new Date(Math.max(doc.createdAt.getTime(), Date.now() - rand(60 * DAY)));
      patients.push({
        name: `${pick(FIRST)} ${pick(LAST)}`,
        age: 5 + rand(80),
        gender: pick(['male', 'female', 'other']),
        phone: phone(),
        condition: pick(CONDITIONS),
        doctor: doc._id,
        createdAt,
        updatedAt: createdAt,
      });
    }
  });
  await Patient.insertMany(patients);

  console.log(`Seeded: 1 admin, ${doctors.length} doctors, ${patients.length} patients`);
  console.log(`Login -> ${env.ADMIN_EMAIL} / ${env.ADMIN_PASSWORD}`);
  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
