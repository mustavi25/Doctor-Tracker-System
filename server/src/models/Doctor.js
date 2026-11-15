const { Schema, model } = require('mongoose');

const doctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    hospital: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

// Every index ends with _id because list queries sort by (field, _id): the _id tie-breaker keeps
// pagination stable, and the index must contain it or MongoDB falls back to an in-memory SORT.
doctorSchema.index({ createdAt: -1, _id: -1 }); // default list, date range (also serves oldest-first in reverse)
doctorSchema.index({ specialization: 1, createdAt: -1, _id: -1 }); // specialization filter + sort
doctorSchema.index({ hospital: 1, createdAt: -1, _id: -1 }); // hospital filter + sort
doctorSchema.index({ name: 1, _id: 1 }); // name sort (A-Z, and Z-A in reverse)

module.exports = model('Doctor', doctorSchema);
