const mongoose = require("mongoose");

// One record per room per billing month. Created/updated when the owner
// does a bulk units update for that month.
const electricityBillSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    // The tenant this bill belongs to (denormalized for fast tenant-side lookup)
    tenantUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    month: {
      type: Number, // 1-12
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },

    unitsConsumed: {
      type: Number,
      required: true,
      default: 0,
    },
    ratePerUnit: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },

    status: {
      type: String,
      enum: ["paid", "pending"],
      default: "pending",
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// One bill per room per month/year
electricityBillSchema.index({ room: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("ElectricityBill", electricityBillSchema);
