const { Schema, model } = require('mongoose');

const patientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 0, max: 130 },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    phone: { type: String, trim: true },
    condition: { type: String, required: true, trim: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  },
  { timestamps: true }
);

// Every index ends with _id because list queries sort by (field, _id): the _id tie-breaker keeps
// pagination stable, and the index must contain it or MongoDB falls back to an in-memory SORT.
patientSchema.index({ doctor: 1, createdAt: -1, _id: -1 }); // a doctor's patients + per-doctor counts
patientSchema.index({ condition: 1, createdAt: -1, _id: -1 }); // condition filter + breakdown
patientSchema.index({ createdAt: -1, _id: -1 }); // default list, date range, dashboard time series
patientSchema.index({ name: 1, _id: 1 }); // name sort

module.exports = model('Patient', patientSchema);
