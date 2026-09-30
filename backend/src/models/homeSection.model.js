const mongoose = require("mongoose");

const homeSectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["hero", "categories", "explore", "listings", "banner"],
      required: true,
    },
    title: { type: String, default: "", trim: true },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    config: {
      category: {
        type: String,
        enum: ["", "Room", "PG", "Hostel", "Flat"],
        default: "",
      },
      area: { type: String, default: "" },
      college: { type: String, default: "" },
      limit: { type: Number, default: 10 },
      viewAllPath: { type: String, default: "" },
      imageUrl: { type: String, default: "" },
      text: { type: String, default: "" },
      buttonText: { type: String, default: "" },
      linkUrl: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeSection", homeSectionSchema);
