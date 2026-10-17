const mongoose = require("mongoose");

const prizeSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  label: { type: String, required: true, trim: true },
  weight: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ["none", "discount", "addon", "item"], required: true },
}, { _id: false });

const loyaltyCafeSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  isDemo: { type: Boolean, default: false },
  active: { type: Boolean, default: true, index: true },
  stampsRequired: { type: Number, default: 5, min: 1, max: 20 },
  dailyStampLimit: { type: Number, default: 1, min: 1, max: 20 },
  rewardExpiryDays: { type: Number, default: 7, min: 1, max: 365 },
  stampRewardLabel: { type: String, default: "Free Chai", trim: true, maxlength: 100 },
  staffPinHash: { type: String, required: true, select: false },
  dailyRewardBudget: { type: Number, default: 10, min: 0, max: 10000 },
  prizes: { type: [prizeSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.models.LoyaltyCafe || mongoose.model("LoyaltyCafe", loyaltyCafeSchema);
