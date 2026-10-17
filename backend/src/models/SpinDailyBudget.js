const mongoose = require("mongoose");

const spinDailyBudgetSchema = new mongoose.Schema({
  cafeSlug: { type: String, required: true },
  dayIST: { type: String, required: true },
  count: { type: Number, required: true, default: 0 },
});

spinDailyBudgetSchema.index({ cafeSlug: 1, dayIST: 1 }, { unique: true });

module.exports = mongoose.models.SpinDailyBudget || mongoose.model("SpinDailyBudget", spinDailyBudgetSchema);
