const mongoose = require("mongoose");

const httpsUrl = {
  type: String,
  trim: true,
  match: /^https:\/\/.+/i,
};

const adSchema = new mongoose.Schema(
  {
    slot: {
      type: String,
      enum: ["top", "bottom"],
      required: true,
    },
    targetBy: {
      type: String,
      enum: ["all", "cafe", "location"],
      default: "cafe",
      required: true,
    },
    cafe: {
      type: String,
      default: "all",
      trim: true,
      lowercase: true,
    },
    cafes: {
      type: [String],
      default: undefined,
      lowercase: true,
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    logoUrl: {
      ...httpsUrl,
      required: function () { return this.slot === "top"; },
    },
    imageUrl: {
      ...httpsUrl,
      required: function () { return this.slot === "bottom"; },
    },
    linkUrl: {
      ...httpsUrl,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    startsAt: {
      type: Date,
      default: Date.now,
    },
    endsAt: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true }
);

adSchema.index({ slot: 1, cafe: 1, active: 1 });
adSchema.index({ slot: 1, cafes: 1, active: 1 });
adSchema.index({ slot: 1, location: 1, active: 1 });

module.exports = mongoose.model("Ad", adSchema);
