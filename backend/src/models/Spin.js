const mongoose = require("mongoose");

const spinSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cafeId: { type: mongoose.Schema.Types.ObjectId, ref: "Cafe", required: true },
  dateKey: { type: String, required: true },
  rewardSnapshot: {
    label: { type: String, required: true },
    valueRs: { type: Number, required: true, min: 0 },
    isNoWin: { type: Boolean, default: false },
  },
  redeemCode: { type: String, default: null },
  status: { type: String, enum: ["unused", "used", "expired", null], default: null },
  expiresAt: { type: Date, default: null },
  redeemedAt: { type: Date, default: null },
}, { timestamps: true });

spinSchema.index({ userId: 1, cafeId: 1, dateKey: 1 }, { unique: true });
spinSchema.index(
  { redeemCode: 1 },
  { unique: true, partialFilterExpression: { redeemCode: { $type: "string" } } }
);
spinSchema.index({ cafeId: 1, redeemCode: 1 });

module.exports = mongoose.models.Spin || mongoose.model("Spin", spinSchema);
