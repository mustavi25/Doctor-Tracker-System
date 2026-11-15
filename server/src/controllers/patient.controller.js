const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { invalidateStats } = require('../utils/cache');
const { escapeRegex, dateRange, buildMeta, SORTS, toUpdateOps } = require('../utils/helpers');

// Shared by /patients and /doctors/:id/patients
function buildPatientFilter(q, forcedDoctorId) {
  const filter = {};
  const doctor = forcedDoctorId || q.doctor;
  if (doctor) filter.doctor = doctor;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ name: rx }, { condition: rx }, { phone: rx }];
  }
  if (q.condition) filter.condition = q.condition;
  if (q.gender) filter.gender = q.gender;
  const created = dateRange(q.from, q.to);
  if (created) filter.createdAt = created;
  return filter;
}

// GET /api/patients
exports.list = asyncHandler(async (req, res) => {
  const q = req.validated.query;
  const filter = buildPatientFilter(q);

  const [data, total] = await Promise.all([
    Patient.find(filter)
      .sort(SORTS[q.sort])
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate('doctor', 'name specialization')
      .lean(),
    Patient.countDocuments(filter),
  ]);
  res.json({ data, meta: buildMeta(q.page, q.limit, total) });
});

// GET /api/patients/conditions -> options for the condition filter
exports.conditions = asyncHandler(async (_req, res) => {
  const conditions = await Patient.distinct('condition');
  res.json({ conditions: conditions.sort() });
});

// GET /api/patients/:id
exports.getOne = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.validated.params.id)
    .populate('doctor', 'name specialization')
    .lean();
  if (!patient) throw new ApiError(404, 'Patient not found');
  res.json({ data: patient });
});

// PUT /api/patients/:id
exports.update = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  if (body.doctor && !(await Doctor.exists({ _id: body.doctor }))) {
    throw new ApiError(404, 'Doctor not found');
  }
  const patient = await Patient.findByIdAndUpdate(req.validated.params.id, toUpdateOps(body), {
    new: true,
    runValidators: true,
  })
    .populate('doctor', 'name specialization')
    .lean();
  if (!patient) throw new ApiError(404, 'Patient not found');
  invalidateStats();
  res.json({ data: patient });
});

// DELETE /api/patients/:id
exports.remove = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndDelete(req.validated.params.id);
  if (!patient) throw new ApiError(404, 'Patient not found');
  invalidateStats();
  res.json({ message: 'Patient deleted' });
});

exports.buildPatientFilter = buildPatientFilter;
