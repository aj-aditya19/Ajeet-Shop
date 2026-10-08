const { Schema, model } = require('mongoose');

const fieldSchema = new Schema(
  {
    key: { type: String, required: true, match: /^[a-zA-Z][a-zA-Z0-9]*$/ },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: ['text', 'number', 'select', 'textarea'], default: 'text' },
    required: { type: Boolean, default: false },
    options: [String],
  },
  { _id: false }
);

const schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: { type: String, enum: ['printing', 'digital', 'other'], default: 'other', index: true },
    description: { type: String, default: '', trim: true },
    active: { type: Boolean, default: true, index: true },
    fields: { type: [fieldSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = model('Service', schema);
