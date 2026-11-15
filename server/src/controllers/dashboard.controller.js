const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const asyncHandler = require('../utils/asyncHandler');
const { cached } = require('../utils/cache');

const DAY = 24 * 60 * 60 * 1000;
const startOfUtcDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

// Fill days with no records so charts show a continuous series
function fillDays(rows, since, days) {
  const map = new Map(rows.map((r) => [r._id, r.count]));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(since.getTime() + i * DAY).toISOString().slice(0, 10);
    return { date, count: map.get(date) || 0 };
  });
}

const dailyCounts = (Model, since) =>
  Model.aggregate([
    { $match: { createdAt: { $gte: since } } }, // uses the createdAt index
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

async function computeStats(days) {
  const since = new Date(startOfUtcDay(new Date()).getTime() - (days - 1) * DAY);
  const weekAgo = new Date(Date.now() - 7 * DAY);

  // All queries are independent -> run in parallel
  const [
    totalDoctors, totalPatients, newDoctorsThisWeek, newPatientsThisWeek,
    perDoctor, patientsDaily, doctorsDaily, conditions, specializations,
  ] = await Promise.all([
    Doctor.estimatedDocumentCount(),
    Patient.estimatedDocumentCount(),
    Doctor.countDocuments({ createdAt: { $gte: weekAgo } }),
    Patient.countDocuments({ createdAt: { $gte: weekAgo } }),

    // Group first, then $lookup only the top 10 (join 10 docs, not every patient)
    Patient.aggregate([
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doctor' } },
      { $unwind: '$doctor' },
      { $project: { _id: 0, doctorId: '$_id', name: '$doctor.name', specialization: '$doctor.specialization', count: 1 } },
    ]),

    dailyCounts(Patient, since),
    dailyCounts(Doctor, since),

    Patient.aggregate([
      { $group: { _id: '$condition', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, condition: '$_id', count: 1 } },
    ]),

    Doctor.aggregate([
      { $group: { _id: '$specialization', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, specialization: '$_id', count: 1 } },
    ]),
  ]);

  return {
    totals: {
      doctors: totalDoctors,
      patients: totalPatients,
      avgPatientsPerDoctor: totalDoctors ? +(totalPatients / totalDoctors).toFixed(1) : 0,
      newDoctorsThisWeek,
      newPatientsThisWeek,
    },
    patientsPerDoctor: perDoctor,
    patientsOverTime: fillDays(patientsDaily, since, days),
    doctorsOverTime: fillDays(doctorsDaily, since, days),
    conditionBreakdown: conditions,
    doctorsBySpecialization: specializations,
    rangeDays: days,
  };
}

// GET /api/dashboard/stats?days=30   (cached for 30s, cleared by every doctor/patient write)
exports.stats = asyncHandler(async (req, res) => {
  const { days } = req.validated.query;
  res.json(await cached(`stats:${days}`, () => computeStats(days)));
});
