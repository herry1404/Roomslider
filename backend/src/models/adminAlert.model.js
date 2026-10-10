const mongoose = require("mongoose");

const adminAlertSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 240 },
    link: { type: String, required: true, trim: true, maxlength: 300 },
    details: {
      action: { type: String, trim: true, maxlength: 30 },
      visitorName: { type: String, trim: true, maxlength: 100 },
      visitorPhone: { type: String, trim: true, maxlength: 30 },
      visitorEmail: { type: String, trim: true, maxlength: 160 },
      listingTitle: { type: String, trim: true, maxlength: 160 },
      listingCategory: { type: String, trim: true, maxlength: 40 },
      listingLocation: { type: String, trim: true, maxlength: 160 },
      ownerName: { type: String, trim: true, maxlength: 100 },
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminAlertSchema.index({ isRead: 1, createdAt: -1 });

module.exports =
  mongoose.models.AdminAlert ||
  mongoose.model("AdminAlert", adminAlertSchema);
