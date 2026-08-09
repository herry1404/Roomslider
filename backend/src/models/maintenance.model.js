const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ["electrical", "plumbing", "appliance", "structural", "other"],
      default: "other",
    },
    photoUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Maintenance", maintenanceSchema);
