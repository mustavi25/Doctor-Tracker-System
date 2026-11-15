const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { invalidateStats } = require('../utils/cache');
const { escapeRegex, dateRange, buildMeta, SORTS } = require('../utils/helpers');
const { buildPatientFilter } = require('./patient.controller');

// GET /api/doctors
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, search, specialization, hospital, from, to, sort } = req.validated.query;

  const filter = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { hospital: rx }, { specialization: rx }];
  }
  if (specialization) filter.specialization = specialization;
  if (hospital) filter.hospital = hospital;
  const created = dateRange(from, to);
  if (created) filter.createdAt = created;

  const [data, total] = await Promise.all([
    Doctor.find(filter).sort(SORTS[sort]).skip((page - 1) * limit).limit(limit).lean(),
    Doctor.countDocuments(filter),
  ]);

  // One grouped query for the whole page instead of N count queries
  const counts = await Patient.aggregate([
    { $match: { doctor: { $in: data.map((d) => d._id) } } },
    { $group: { _id: '$doctor', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  const withCounts = data.map((d) => ({ ...d, patientCount: countMap.get(String(d._id)) || 0 }));

  res.json({ data: withCounts, meta: buildMeta(page, limit, total) });
});

// GET /api/doctors/filters  -> options for filter dropdowns
exports.filterOptions = asyncHandler(async (_req, res) => {
  const [specializations, hospitals] = await Promise.all([
    Doctor.distinct('specialization'),
    Doctor.distinct('hospital'),
  ]);
  res.json({ specializations: specializations.sort(), hospitals: hospitals.sort() });
});

// GET /api/doctors/options  -> id + name only, for dropdowns (capped so it can never explode)
exports.options = asyncHandler(async (_req, res) => {
  const data = await Doctor.find().select('name specialization').sort({ name: 1 }).limit(500).lean();
  res.json({ data });
});

// POST /api/doctors
exports.create = asyncHandler(async (req, res) => {
  const doctor = await Doctor.create(req.validated.body);
  invalidateStats();
  res.status(201).json({ data: doctor });
});

// GET /api/doctors/:id
exports.getOne = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const [doctor, patientCount] = await Promise.all([
    Doctor.findById(id).lean(),
    Patient.countDocuments({ doctor: id }),
  ]);
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  res.json({ data: { ...doctor, patientCount } });
});

// PUT /api/doctors/:id
exports.update = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.validated.params.id, req.validated.body, {
    new: true,
    runValidators: true,
  }).lean();
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  invalidateStats();
  res.json({ data: doctor });
});

// DELETE /api/doctors/:id  (cascades to the doctor's patients)
exports.remove = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const doctor = await Doctor.findByIdAndDelete(id);
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  const { deletedCount } = await Patient.deleteMany({ doctor: id });
  invalidateStats();
  res.json({ message: 'Doctor deleted', patientsDeleted: deletedCount });
});

// ---------- nested: a doctor's patients ----------

// GET /api/doctors/:id/patients
exports.listPatients = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { page, limit, sort } = req.validated.query;
  if (!(await Doctor.exists({ _id: id }))) throw new ApiError(404, 'Doctor not found');

  const filter = buildPatientFilter(req.validated.query, id);
  const [data, total] = await Promise.all([
    Patient.find(filter).sort(SORTS[sort]).skip((page - 1) * limit).limit(limit).lean(),
    Patient.countDocuments(filter),
  ]);
  res.json({ data, meta: buildMeta(page, limit, total) });
});

// POST /api/doctors/:id/patients
exports.addPatient = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  if (!(await Doctor.exists({ _id: id }))) throw new ApiError(404, 'Doctor not found');
  const patient = await Patient.create({ ...req.validated.body, doctor: id });
  invalidateStats();
  res.status(201).json({ data: patient });
});

// DELETE /api/doctors/:id/patients/:patientId
exports.removePatient = asyncHandler(async (req, res) => {
  const { id, patientId } = req.validated.params;
  const patient = await Patient.findOneAndDelete({ _id: patientId, doctor: id });
  if (!patient) throw new ApiError(404, 'Patient not found for this doctor');
  invalidateStats();
  res.json({ message: 'Patient removed' });
});
