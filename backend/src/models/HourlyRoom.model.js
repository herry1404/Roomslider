const mongoose = require("mongoose");

const hourlyRoomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    images: [{ type: String }],
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    pricePerHour: {
      type: Number,
      required: true,
    },
    amenities: [{ type: String }],

    // Owner requests this room to be listed as hourly
    requestedByOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },

    // Admin who approved/created the final listing
    approvedByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isActive: {
      type: Boolean,
      default: false, // becomes true only after admin approval
    },

    rejectionReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HourlyRoom", hourlyRoomSchema);
