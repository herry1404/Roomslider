const mongoose = require("mongoose");

const stampCardSchema = new mongoose.Schema({
  cafeSlug: { type: String, required: true, lowercase: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  phone: { type: String, required: true, match: /^[6-9]\d{9}$/ },
  cardCode: { type: String, required: true, uppercase: true, minlength: 6, maxlength: 6 },
  tokenHash: { type: String, required: true, select: false },
  stamps: { type: Number, default: 0, min: 0 },
  totalStamps: { type: Number, default: 0, min: 0 },
  completedCards: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

stampCardSchema.index({ cafeSlug: 1, phone: 1 }, { unique: true });
stampCardSchema.index({ cafeSlug: 1, cardCode: 1 }, { unique: true });
stampCardSchema.index({ cafeSlug: 1, tokenHash: 1 });

module.exports = mongoose.models.StampCard || mongoose.model("StampCard", stampCardSchema);
