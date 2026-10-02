const mongoose = require("mongoose");

const hourlyBookingSchema = new mongoose.Schema(
  {
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HourlyRoom",
      required: true,
    },

    // Guest profile snapshot (captured once, reused on future bookings)
    guestName: { type: String, required: true },
    guestPhone: { type: String, required: true },
    idProofType: { type: String, required: true },
    idProofNumber: { type: String, required: true },
    idProofPhotoUrl: { type: String, required: true },

    bookedFrom: { type: Date, required: true },
    bookedTo: { type: Date, required: true },

    // Payment
    amount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paidAt: { type: Date },

    // Booking lifecycle — "confirmed" only happens after payment succeeds
    status: {
      type: String,
      enum: ["pending_payment", "confirmed", "cancelled", "completed"],
      default: "pending_payment",
    },

    // Cancellation
    cancelledAt: { type: Date },
    refundAmount: { type: Number },
    cancellationCutPercent: { type: Number },

    // Who last handled/completed/cancelled this booking (Admin or Hourly Room Manager)
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "handledByModel",
    },
    handledByModel: {
      type: String,
      enum: ["User", "HourlyRoomManager"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HourlyBooking", hourlyBookingSchema);
