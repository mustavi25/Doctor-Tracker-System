const { z } = require('zod');

const emptyToUndef = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const optStr = (max = 100) => z.preprocess(emptyToUndef, z.string().trim().max(max).optional());
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const optObjectId = z.preprocess(emptyToUndef, objectId.optional());
const optDate = z.preprocess(
  emptyToUndef,
  z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date').optional()
);
const phone = z.string().trim().regex(/^[+()\d\s-]{7,20}$/, 'Invalid phone number');

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
};
const sort = z.enum(['newest', 'oldest', 'name_asc', 'name_desc']).default('newest');

// ---- params
const idParam = z.object({ id: objectId });
const doctorPatientParams = z.object({ id: objectId, patientId: objectId });

// ---- auth
const loginBody = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

// ---- doctors
const doctorBody = z.object({
  name: z.string().trim().min(2).max(100),
  specialization: z.string().trim().min(2).max(100),
  hospital: z.string().trim().min(2).max(150),
  phone,
  email: z.string().trim().toLowerCase().email('Invalid email'),
});
const doctorUpdateBody = doctorBody.partial().refine((o) => Object.keys(o).length > 0, {
  message: 'At least one field is required',
});
const doctorListQuery = z.object({
  ...pagination,
  search: optStr(),
  specialization: optStr(),
  hospital: optStr(),
  from: optDate,
  to: optDate,
  sort,
});

// ---- patients
const patientFields = {
  name: z.string().trim().min(2).max(100),
  age: z.coerce.number().int().min(0).max(130).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  phone: phone.optional(),
  condition: z.string().trim().min(2).max(150),
};
const patientBody = z.object(patientFields);
// On update, null clears an optional field (age / gender / phone)
const patientUpdateBody = z
  .object({
    name: patientFields.name.optional(),
    condition: patientFields.condition.optional(),
    doctor: objectId.optional(),
    age: z.number().int().min(0).max(130).nullable().optional(),
    gender: z.enum(['male', 'female', 'other']).nullable().optional(),
    phone: phone.nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field is required' });
const patientListQuery = z.object({
  ...pagination,
  search: optStr(),
  condition: optStr(),
  gender: z.preprocess(emptyToUndef, z.enum(['male', 'female', 'other']).optional()),
  doctor: optObjectId,
  from: optDate,
  to: optDate,
  sort,
});
const doctorPatientsQuery = patientListQuery.omit({ doctor: true });

// ---- dashboard
const dashboardQuery = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
});

module.exports = {
  idParam, doctorPatientParams, loginBody,
  doctorBody, doctorUpdateBody, doctorListQuery,
  patientBody, patientUpdateBody, patientListQuery, doctorPatientsQuery,
  dashboardQuery,
};
