const mongoose = require("mongoose");

const dailyCodeSchema = new mongoose.Schema({
  cafeId: { type: mongoose.Schema.Types.ObjectId, ref: "Cafe", required: true },
  dateKey: { type: String, required: true },
  code: { type: String, required: true, uppercase: true, match: /^[A-HJ-NP-Z]{3}[2-9]{2}$/ },
  attempts: { type: Map, of: Number, default: {} },
  regeneratedAt: { type: Date, default: null },
}, { timestamps: true });

dailyCodeSchema.index({ cafeId: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.models.DailyCode || mongoose.model("DailyCode", dailyCodeSchema);
