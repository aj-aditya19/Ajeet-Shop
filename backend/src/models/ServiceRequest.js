const { Schema, model } = require('mongoose');

const STATUSES = ['pending', 'accepted', 'in_progress', 'ready', 'completed', 'rejected'];

const schema = new Schema(
  {
    requestId: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    status: { type: String, enum: STATUSES, default: 'pending', index: true },
    contact: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
    formData: { type: Schema.Types.Mixed, default: {} },
    additionalInstructions: { type: String, default: '', maxlength: 1000 },
    contactPreference: { type: String, enum: ['call', 'whatsapp', 'email'], default: 'whatsapp' },
    uploadedFiles: [{ type: Schema.Types.ObjectId, ref: 'UploadedFile' }],
    adminMessage: { type: String, default: '', maxlength: 1000 },
    statusHistory: [
      {
        _id: false,
        status: String,
        at: { type: Date, default: Date.now },
        by: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    // Placeholder so payments can be added later without a schema rewrite (no gateway is implemented).
    payment: {
      status: { type: String, enum: ['none', 'unpaid', 'paid', 'refunded'], default: 'none' },
      amount: { type: Number, default: null },
    },
    completedAt: Date,
  },
  { timestamps: true }
);

schema.index({ createdAt: -1 });

module.exports = model('ServiceRequest', schema);
module.exports.STATUSES = STATUSES;
