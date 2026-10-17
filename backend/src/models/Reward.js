const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, minlength: 8, maxlength: 8, index: true },
  cafeSlug: { type: String, required: true, index: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: "StampCard", required: true, index: true },
  source: { type: String, enum: ["stamp", "spin"], required: true },
  label: { type: String, required: true, trim: true, maxlength: 100 },
  status: { type: String, enum: ["active", "used", "expired"], default: "active", index: true },
  expiresAt: { type: Date, required: true, index: true },
  usedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now, immutable: true },
});

module.exports = mongoose.models.Reward || mongoose.model("Reward", rewardSchema);
