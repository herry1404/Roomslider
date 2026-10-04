const mongoose = require("mongoose");

const listingEngagementSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    visitorKey: { type: String, required: true },
    day: { type: String, required: true },
    type: {
      type: String,
      enum: ["view", "call", "whatsapp", "chat"],
      required: true,
    },
  },
  { timestamps: true }
);

listingEngagementSchema.index(
  { room: 1, visitorKey: 1, day: 1, type: 1 },
  { unique: true }
);

module.exports = mongoose.model("ListingEngagement", listingEngagementSchema);
