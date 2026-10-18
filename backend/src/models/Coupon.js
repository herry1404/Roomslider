const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  kind: { type: String, enum: ["local", "online"], required: true },
  sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: "Sponsor", default: null },
  brand: { type: String, required: true, trim: true, maxlength: 100 },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 80 },
  link: { type: String, default: "", trim: true, maxlength: 2048 },
  terms: { type: String, default: "", trim: true, maxlength: 1000 },
  expiresAt: { type: Date, default: null },
  stock: { type: Number, required: true, min: 0, default: 0 },
  claimed: { type: Number, required: true, min: 0, default: 0 },
  weight: { type: Number, required: true, min: 1, max: 1000000, default: 1 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ kind: 1, sponsorId: 1, active: 1, expiresAt: 1, stock: 1 });

module.exports = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
