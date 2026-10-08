const { Schema, model } = require('mongoose');

const schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: { type: String, enum: ['bhati', 'chari', 'kadai', 'patila', 'other'], default: 'other' },
    description: { type: String, default: '', trim: true },
    imageUrl: { type: String, default: '' },
    totalQuantity: { type: Number, required: true, min: 0, validate: Number.isInteger },
    defaultRate: { type: Number, required: true, min: 0 }, // rupees per day
    active: { type: Boolean, default: true },
    showAvailability: { type: Boolean, default: false }, // expose in-stock info publicly?
  },
  { timestamps: true }
);

module.exports = model('CateringEquipment', schema);
