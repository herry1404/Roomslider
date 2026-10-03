const mongoose = require("mongoose");

const orderAddOnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const messOrderSchema = new mongoose.Schema(
  {
    mess: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mess",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    thaliCount: { type: Number, default: 1 },
    mealType: { type: String, enum: ["thali", "tiffin"], default: "thali" },
    pricePerPerson: { type: Number, required: true },
    addOns: { type: [orderAddOnSchema], default: [] },
    totalAmount: { type: Number, required: true },
    deliveryAddress: {
      recipientName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      mapLink: { type: String, required: true },
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: { type: String },
    paidAt: { type: Date, default: null },

    orderStatus: {
      type: String,
      enum: ["placed", "confirmed", "delivered", "cancelled"],
      default: "placed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MessOrder", messOrderSchema);
