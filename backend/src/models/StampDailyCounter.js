const mongoose = require("mongoose");

const stampDailyCounterSchema = new mongoose.Schema({
  cafeSlug: { type: String, required: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: "StampCard", required: true },
  dayIST: { type: String, required: true },
  count: { type: Number, required: true, default: 0 },
});

stampDailyCounterSchema.index({ cafeSlug: 1, cardId: 1, dayIST: 1 }, { unique: true });

module.exports = mongoose.models.StampDailyCounter || mongoose.model("StampDailyCounter", stampDailyCounterSchema);
