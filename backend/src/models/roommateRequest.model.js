const mongoose = require("mongoose");

const roommateRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

roommateRequestSchema.index({ from: 1, to: 1 }, { unique: true });
roommateRequestSchema.index({ to: 1, status: 1 });

module.exports =
  mongoose.models.RoommateRequest ||
  mongoose.model("RoommateRequest", roommateRequestSchema);
