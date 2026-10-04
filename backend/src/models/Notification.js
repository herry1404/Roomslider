const mongoose = require("mongoose");

const TYPES = [
  "roommate_request", "roommate_accepted", "roommate_message", "service_request", "service_status",
  "vacate_notice", "payment", "loan_status", "furniture_status", "vehicle_status", "maintenance", "blood_request", "broadcast", "saved_search", "system",
];

const notificationSchema = new mongoose.Schema({
  // `recipient` fields remain for existing broadcast/hourly-manager consumers.
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, refPath: "recipientModel" },
  recipientModel: { type: String, enum: ["User", "Owner", "HourlyRoomManager"], default: "User" },
  type: { type: String, enum: TYPES, default: "system" },
  title: { type: String, required: true, maxlength: 120 },
  body: { type: String, maxlength: 500, default: "" },
  link: { type: String, default: "" },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  priority: { type: String, enum: ["normal", "high"], default: "normal" },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  // Compatibility aliases for existing callers and records.
  message: { type: String, default: "" },
  actionUrl: { type: String, default: "" },
  read: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
notificationSchema.index({ recipient: 1, recipientModel: 1, createdAt: -1 });

notificationSchema.statics.types = TYPES;

module.exports = mongoose.model("Notification", notificationSchema);
