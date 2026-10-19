const mongoose = require("mongoose");

const analyticsDedupeSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, maxlength: 300 },
  expiresAt: { type: Date, required: true, expires: 0 },
});

module.exports = mongoose.models.AnalyticsDedupe
  || mongoose.model("AnalyticsDedupe", analyticsDedupeSchema);
