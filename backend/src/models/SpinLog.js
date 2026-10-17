const mongoose = require("mongoose");

const spinLogSchema = new mongoose.Schema({
  cafeSlug: { type: String, required: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: "StampCard", required: true },
  dayIST: { type: String, required: true },
  prizeKey: { type: String, required: true },
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: "Reward", default: null },
}, { timestamps: true });

spinLogSchema.index({ cafeSlug: 1, cardId: 1, dayIST: 1 }, { unique: true });

module.exports = mongoose.models.SpinLog || mongoose.model("SpinLog", spinLogSchema);
