const mongoose = require("mongoose");

const donationRequestSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  itemType: {
    type: String,
    enum: ["books", "clothes", "furniture", "utensils", "electronics", "bedding", "other"],
    required: true,
  },
  description: { type: String, required: true, trim: true, maxlength: 1500 },
  quantity: { type: Number, required: true, min: 1, max: 100 },
  condition: { type: String, enum: ["good", "usable", "needs_repair"], required: true },
  photos: [{ type: String }],
  address: {
    flat: { type: String, required: true, trim: true, maxlength: 100 },
    building: { type: String, default: "", trim: true, maxlength: 150 },
    area: { type: String, required: true, trim: true, maxlength: 100 },
    landmark: { type: String, default: "", trim: true, maxlength: 200 },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: undefined },
    },
  },
  preferredDate: { type: Date, required: true },
  preferredTimeSlot: { type: String, enum: ["morning", "afternoon", "evening"], required: true },
  status: {
    type: String,
    enum: ["new", "pickup_scheduled", "collected", "listed", "cancelled"],
    default: "new",
    index: true,
  },
  catalogItem: { type: mongoose.Schema.Types.ObjectId, ref: "FurnitureItem", default: null },
}, { timestamps: true });

donationRequestSchema.index({ donor: 1, createdAt: -1 });

module.exports = mongoose.model("DonationRequest", donationRequestSchema);
