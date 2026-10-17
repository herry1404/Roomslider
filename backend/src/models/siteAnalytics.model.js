const mongoose = require("mongoose");

const siteAnalyticsSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, maxlength: 80 },
    eventId: { type: String, maxlength: 80, index: true },
    path: { type: String, required: true, maxlength: 160 },
    source: { type: String, required: true, maxlength: 100, default: "Direct" },
    referrer: { type: String, maxlength: 100, default: "" },
    platform: { type: String, required: true, maxlength: 24 },
    device: { type: String, required: true, enum: ["Mobile", "Desktop"] },
    durationSeconds: { type: Number, min: 0, max: 43200, default: 0 },
  },
  { timestamps: true }
);

siteAnalyticsSchema.index({ createdAt: -1 });

module.exports = mongoose.model("SiteAnalytics", siteAnalyticsSchema);
