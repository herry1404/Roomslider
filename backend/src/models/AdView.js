const mongoose = require("mongoose");

const adViewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cafeId: { type: mongoose.Schema.Types.ObjectId, ref: "Cafe", required: true },
  sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: "Sponsor", required: true },
  dateKey: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  startedAt: { type: Date, required: true },
  completedAt: { type: Date, default: null },
  spinUsed: { type: Boolean, default: false },
}, { timestamps: true });

adViewSchema.index({ userId: 1, cafeId: 1, dateKey: 1, completedAt: 1, spinUsed: 1 });
adViewSchema.index({ sponsorId: 1, dateKey: 1 });

module.exports = mongoose.models.AdView || mongoose.model("AdView", adViewSchema);
