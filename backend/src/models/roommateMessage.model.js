const mongoose = require("mongoose");

const roommateMessageSchema = new mongoose.Schema(
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
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    readAt: { type: Date, default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

roommateMessageSchema.index({ from: 1, to: 1, createdAt: -1 });
roommateMessageSchema.index({ to: 1, from: 1, createdAt: -1 });

module.exports =
  mongoose.models.RoommateMessage ||
  mongoose.model("RoommateMessage", roommateMessageSchema);
