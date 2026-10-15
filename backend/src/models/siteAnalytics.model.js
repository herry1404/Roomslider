const mongoose = require("mongoose");

const siteAnalyticsSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, maxlength: 80 },
    path: { type: String, required: true, maxlength: 160 },
    source: { type: String, required: true, maxlength: 100, default: "Direct" },
    referrer: { type: String, maxlength: 100, default: "" },
    platform: { type: String, required: true, maxlength: 24 },
    device: { type: String, required: true, enum: ["Mobile", "Desktop"] },
  },
  { timestamps: true }
);

siteAnalyticsSchema.index({ createdAt: -1 });
siteAnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });

module.exports = mongoose.model("SiteAnalytics", siteAnalyticsSchema);
