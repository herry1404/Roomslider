const mongoose = require("mongoose");

const villaBookingSchema = new mongoose.Schema(
  {
    villa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Villa",
      required: true,
      index: true,
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bookingType: { type: String, enum: ["stay", "event"], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    guestCount: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 1 },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["pending_payment", "confirmed", "cancelled", "completed"],
      default: "pending_payment",
    },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    paidAt: { type: Date },
    pendingExpiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

villaBookingSchema.index({ villa: 1, startDate: 1, endDate: 1, status: 1 });

module.exports = mongoose.model("VillaBooking", villaBookingSchema);
