const mongoose = require("mongoose");

const reelSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      index: true,
    },
    videoUrl: { type: String, required: true },
    videoPublicId: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    caption: { type: String, trim: true, maxlength: 300, default: "" },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
    likes: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["active", "hidden"],
      default: "active",
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reelSchema.index({ status: 1, createdAt: -1 });

module.exports =
  mongoose.models.Reel || mongoose.model("Reel", reelSchema);
