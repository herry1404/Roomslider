const mongoose = require("mongoose");

const adminAlertRateLimitSchema = new mongoose.Schema(
  {
    channel: { type: String, enum: ["telegram", "whatsapp"], required: true },
    eventType: { type: String, required: true },
    lastSentAt: { type: Date, required: true, default: new Date(0) },
  },
  { versionKey: false }
);

adminAlertRateLimitSchema.index({ channel: 1, eventType: 1 }, { unique: true });

module.exports =
  mongoose.models.AdminAlertRateLimit ||
  mongoose.model("AdminAlertRateLimit", adminAlertRateLimitSchema);
