const mongoose = require("mongoose");

const cafeMenuAnalyticsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["menu_view", "ad_impression", "ad_click"],
      required: true,
    },
    cafe: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    visitorId: {
      type: String,
      required: true,
      maxlength: 80,
    },
    source: { type: String, trim: true, maxlength: 100, default: "Direct" },
    platform: { type: String, trim: true, maxlength: 24, default: "Other" },
    adId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ad",
      default: undefined,
    },
  },
  { timestamps: true }
);

cafeMenuAnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 34560000 });
cafeMenuAnalyticsSchema.index({ createdAt: -1, type: 1, cafe: 1, location: 1 });
cafeMenuAnalyticsSchema.index({ adId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model("CafeMenuAnalytics", cafeMenuAnalyticsSchema);
