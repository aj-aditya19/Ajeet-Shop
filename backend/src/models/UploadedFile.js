const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    originalName: { type: String, required: true },
    storageUrl: { type: String, required: true, select: false },
    storageId: { type: String, required: true, select: false },
    provider: {
      type: String,
      enum: ["cloudinary", "local"],
      required: true,
      select: false,
    },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    request: {
      type: Schema.Types.ObjectId,
      ref: "ServiceRequest",
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

module.exports = model("UploadedFile", schema);
