const mongoose = require("mongoose");

const analyticsEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "page_view",
      "listing_view",
      "call_click",
      "whatsapp_click",
      "wishlist",
      "share",
      "search",
      "signup",
      "login",
      "menu_scan",
      "menu_item_view",
    ],
    required: true,
  },
  entityType: {
    type: String,
    enum: ["room", "pg", "hostel", "flat", "mess", "villa", "vehicle", "furniture", "cafe", "other"],
    default: "other",
  },
  entityId: { type: String, default: "" },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, default: null },
  sessionId: { type: String, required: true, maxlength: 80 },
  device: { type: String, enum: ["mobile", "desktop", "tablet"], required: true },
  source: {
    type: String,
    enum: ["google", "instagram", "whatsapp", "direct", "qr", "other"],
    default: "other",
  },
  area: { type: String, trim: true, maxlength: 100, default: "" },
  searchQuery: { type: String, trim: true, maxlength: 200, default: "" },
  resultCount: { type: Number, min: 0, default: null },
  createdAt: { type: Date, default: Date.now, expires: 400 * 24 * 60 * 60 },
});

analyticsEventSchema.index({ type: 1, createdAt: -1 });
analyticsEventSchema.index({ entityId: 1, type: 1, createdAt: -1 });
analyticsEventSchema.index({ ownerId: 1, createdAt: -1 });
analyticsEventSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.models.AnalyticsEventV2
  || mongoose.model("AnalyticsEventV2", analyticsEventSchema, "analyticsevents");
