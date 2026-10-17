const mongoose = require("mongoose");

const checkInSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cafeId: { type: mongoose.Schema.Types.ObjectId, ref: "Cafe", required: true },
  dateKey: { type: String, required: true },
  streak: { type: Number, required: true, min: 1 },
}, { timestamps: true });

checkInSchema.index({ userId: 1, cafeId: 1, dateKey: 1 }, { unique: true });
checkInSchema.index({ cafeId: 1, dateKey: -1 });

module.exports = mongoose.models.CheckIn || mongoose.model("CheckIn", checkInSchema);
