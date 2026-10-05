const mongoose = require("mongoose");

const adminAlertSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 240 },
    link: { type: String, required: true, trim: true, maxlength: 300 },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminAlertSchema.index({ isRead: 1, createdAt: -1 });

module.exports =
  mongoose.models.AdminAlert ||
  mongoose.model("AdminAlert", adminAlertSchema);
