const mongoose = require("mongoose");

const sponsorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  videoUrl: { type: String, default: "", trim: true, maxlength: 2048 },
  durationSec: { type: Number, required: true, min: 10, max: 15, default: 10 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.models.Sponsor || mongoose.model("Sponsor", sponsorSchema);
