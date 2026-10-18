const mongoose = require("mongoose");

const couponClaimSchema = new mongoose.Schema({
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  spinId: { type: mongoose.Schema.Types.ObjectId, ref: "Spin", required: true },
}, { timestamps: true });

couponClaimSchema.index({ couponId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.models.CouponClaim || mongoose.model("CouponClaim", couponClaimSchema);
