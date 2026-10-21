const mongoose = require("mongoose");

const analyticsEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "listing_view",
        "call_click",
        "whatsapp_click",
        "contact_request",
        "wishlist_add",
        "share",
        "owner_profile_view",
        "search",
        "ad_impression",
        "ad_click",
        "page_view",
        "menu_view",
      ],
      required: true,
    },
    listingType: {
      type: String,
      enum: ["room", "pg", "hostel", "flat", "villa", "mess", "vehicle", "hourly", "other"],
      default: "other",
    },
    listingId: { type: mongoose.Schema.Types.ObjectId, default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    visitorId: { type: String, required: true },
    sessionId: { type: String, maxlength: 80 },
    page: { type: String, trim: true, maxlength: 200 },
    cafeSlug: { type: String, trim: true, lowercase: true, maxlength: 80 },
    adId: { type: mongoose.Schema.Types.Mixed, default: null },
    adName: { type: String, trim: true, maxlength: 120 },
    referrer: { type: String, trim: true, maxlength: 200 },
    source: {
      type: String,
      enum: ["home", "search", "map", "listing", "profile", "ad"],
      default: "listing",
    },
    device: { type: String, enum: ["mobile", "desktop", "tablet"], required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

analyticsEventSchema.index({ owner: 1, type: 1, createdAt: -1 });
analyticsEventSchema.index({ listingId: 1, type: 1, createdAt: -1 });
analyticsEventSchema.index({ adId: 1, type: 1, createdAt: -1 });
analyticsEventSchema.index({ visitorId: 1, listingId: 1, type: 1, createdAt: -1 });
analyticsEventSchema.index({ type: 1, cafeSlug: 1, createdAt: -1 });

module.exports = mongoose.models.AnalyticsEvent
  || mongoose.model("AnalyticsEvent", analyticsEventSchema);
