const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true, maxlength: 100 },
  valueRs: { type: Number, required: true, min: 0, max: 100000 },
  weight: { type: Number, required: true, min: 1, max: 1000000 },
  minStreak: { type: Number, default: 0, min: 0, max: 100000 },
}, { _id: true });

const cafeSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  isDemo: { type: Boolean, default: false },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", default: null },
  dailyBudgetRs: { type: Number, required: true, min: 0, max: 1000000, default: 100 },
  budgetDate: { type: String, default: "" },
  spentTodayRs: { type: Number, default: 0, min: 0 },
  rewards: {
    type: [rewardSchema],
    default: [],
    validate: {
      validator: (rewards) => rewards.length >= 5 && rewards.length <= 7,
      message: "Configure between 5 and 7 rewards.",
    },
  },
}, { timestamps: true });

module.exports = mongoose.models.Cafe || mongoose.model("Cafe", cafeSchema);
