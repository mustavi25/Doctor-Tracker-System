/**
 * Prints the MongoDB query plan for the app's important queries so index usage can be
 * verified (and pasted into the README). Run:  npm run seed:bulk && npm run explain
 */
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const { buildPatientFilter } = require('./controllers/patient.controller');
const { escapeRegex, dateRange, SORTS } = require('./utils/helpers');

const DAY = 24 * 60 * 60 * 1000;
const iso = (d) => new Date(d).toISOString().slice(0, 10);

// Flatten a plan tree into "LIMIT > FETCH > IXSCAN(index_name)"
function describePlan(node) {
  if (!node) return '?';
  const plan = node.queryPlan ?? node;
  const chain = [];
  let cur = plan;
  while (cur) {
    chain.push(cur.stage === 'IXSCAN' ? `IXSCAN(${cur.indexName})` : cur.stage);
    cur = cur.inputStage ?? (cur.inputStages ? cur.inputStages[0] : null);
  }
  return chain.join(' > ');
}

function find(obj, key) {
  if (!obj || typeof obj !== 'object') return undefined;
  if (key in obj) return obj[key];
  for (const v of Object.values(obj)) {
    const r = find(v, key);
    if (r !== undefined) return r;
  }
  return undefined;
}

function summarize(name, explain) {
  const es = find(explain, 'executionStats') ?? {};
  const qp = find(explain, 'queryPlanner') ?? {};
  return {
    name,
    plan: describePlan(qp.winningPlan),
    keys: es.totalKeysExamined ?? 0,
    docs: es.totalDocsExamined ?? 0,
    returned: es.nReturned ?? 0,
    ms: es.executionTimeMillis ?? 0,
  };
}

async function run() {
  await connectDB();
  await Promise.all([Doctor.init(), Patient.init()]);
  const [doctorTotal, patientTotal] = await Promise.all([Doctor.estimatedDocumentCount(), Patient.estimatedDocumentCount()]);
  const sample = await Doctor.findOne().lean();
  const rx = new RegExp(escapeRegex('ayesha'), 'i');
  const lastMonth = dateRange(iso(Date.now() - 30 * DAY), iso(Date.now()));
  const rows = [];

  const doctorQ = (name, filter, sort = 'newest') =>
    Doctor.find(filter).sort(SORTS[sort]).skip(0).limit(10).lean().explain('executionStats').then((e) => rows.push(summarize(name, e)));
  const patientQ = (name, filter, sort = 'newest') =>
    Patient.find(filter).sort(SORTS[sort]).skip(0).limit(10).lean().explain('executionStats').then((e) => rows.push(summarize(name, e)));

  // ---- doctors list
  await doctorQ('Doctors: default list (newest)', {});
  await doctorQ('Doctors: filter specialization', { specialization: sample.specialization });
  await doctorQ('Doctors: filter hospital', { hospital: sample.hospital });
  await doctorQ('Doctors: date range (30 days)', { createdAt: lastMonth });
  await doctorQ('Doctors: sort by name', {}, 'name_asc');
  await doctorQ('Doctors: text search (regex)', { $or: [{ name: rx }, { email: rx }, { hospital: rx }, { specialization: rx }] });
  // ---- patients list
  await patientQ('Patients: default list (newest)', {});
  await patientQ("Patients: one doctor's patients", buildPatientFilter({}, String(sample._id)));
  await patientQ('Patients: filter condition', buildPatientFilter({ condition: 'Asthma' }));
  await patientQ('Patients: date range (30 days)', buildPatientFilter({ from: iso(Date.now() - 30 * DAY), to: iso(Date.now()) }));
  await patientQ('Patients: sort by name', {}, 'name_asc');
  await patientQ('Patients: text search (regex)', buildPatientFilter({ search: 'rahim' }));
  // ---- dashboard aggregations
  const agg = async (name, pipeline) =>
    rows.push(summarize(name, await Patient.aggregate(pipeline).explain('executionStats')));
  await agg('Dashboard: patients per doctor ($group)', [{ $group: { _id: '$doctor', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]);
  await agg('Dashboard: patients per day (30 days)', [
    { $match: { createdAt: { $gte: new Date(Date.now() - 30 * DAY) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
  ]);
  await agg('Dashboard: condition breakdown', [{ $group: { _id: '$condition', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]);

  console.log(`\nDataset: ${doctorTotal} doctors, ${patientTotal} patients\n`);
  console.log('| Query | Winning plan | Keys | Docs examined | Returned | ms |');
  console.log('|---|---|---:|---:|---:|---:|');
  for (const r of rows) console.log(`| ${r.name} | ${r.plan} | ${r.keys} | ${r.docs} | ${r.returned} | ${r.ms} |`);
  console.log('');
  await mongoose.connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
