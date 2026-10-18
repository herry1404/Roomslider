const mongoose = require("mongoose");

const spinSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cafeId: { type: mongoose.Schema.Types.ObjectId, ref: "Cafe", required: true },
  type: { type: String, enum: ["cafe", "ad", "coupon"], default: "cafe", required: true },
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
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
  couponSnapshot: {
    brand: { type: String, default: null },
    title: { type: String, default: null },
    code: { type: String, default: null },
    link: { type: String, default: null },
    terms: { type: String, default: null },
    expiresAt: { type: Date, default: null },
  },
}, { timestamps: true });

spinSchema.index({ userId: 1, cafeId: 1, type: 1, dateKey: 1 }, { unique: true });
spinSchema.index(
  { redeemCode: 1 },
  { unique: true, partialFilterExpression: { redeemCode: { $type: "string" } } }
);
spinSchema.index({ cafeId: 1, redeemCode: 1 });

module.exports = mongoose.models.Spin || mongoose.model("Spin", spinSchema);
