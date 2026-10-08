const { Schema, model } = require('mongoose');

const STATUSES = ['active', 'due', 'overdue', 'returned', 'cancelled'];

const schema = new Schema(
  {
    rentalId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, index: true },
    address: { type: String, default: '', trim: true, maxlength: 300 },
    items: {
      type: [
        {
          _id: false,
          equipment: { type: Schema.Types.ObjectId, ref: 'CateringEquipment', required: true },
          quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
          rate: { type: Number, required: true, min: 0 },
        },
      ],
      validate: (v) => v.length > 0,
    },
    rentalDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    status: { type: String, enum: STATUSES, default: 'active', index: true },
    notes: { type: String, default: '', maxlength: 500 },
    discount: { type: Number, default: 0, min: 0 },     // rupees off the bill
    advancePaid: { type: Number, default: 0, min: 0 },  // rupees received in advance
    lastOverdueAlertAt: { type: Date, default: null },  // when the admin was last alerted
    overdueAlertCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

schema.index({ returnDate: 1, dueDate: 1 });

module.exports = model('CateringRental', schema);
module.exports.STATUSES = STATUSES;
