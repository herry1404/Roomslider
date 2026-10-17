const mongoose = require("mongoose");

const stampEventSchema = new mongoose.Schema({
  cafeSlug: { type: String, required: true, index: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: "StampCard", required: true, index: true },
  dayIST: { type: String, required: true },
  at: { type: Date, required: true, default: Date.now },
  source: { type: String, enum: ["staff"], default: "staff", required: true },
}, { timestamps: false });

stampEventSchema.index({ cafeSlug: 1, cardId: 1, dayIST: 1 });

module.exports = mongoose.models.StampEvent || mongoose.model("StampEvent", stampEventSchema);
