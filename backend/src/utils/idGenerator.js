const Counter = require('../models/Counter');

// Human-readable IDs such as AJ-2026-00001 / CR-2026-00001 (atomic, per prefix + year).
async function nextId(prefix, date = new Date()) {
  const year = date.getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { _id: `${prefix}-${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}-${year}-${String(counter.seq).padStart(5, '0')}`;
}
module.exports = { nextId };
