const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      enum: ["bhati", "chari", "kadai", "patila", "other"],
      default: "other",
    },
    description: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "" },
    totalQuantity: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isInteger,
    },
    defaultRate: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    showAvailability: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = model("CateringEquipment", schema);
