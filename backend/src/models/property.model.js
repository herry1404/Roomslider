const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      default: null,
    },
    propertyType: {
      type: String,
      enum: ["Room", "PG", "Hostel", "Flat"],
      default: "Room",
    },
    buildings: [
      {
        name: { type: String, required: true, trim: true },
      },
    ],
    slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    oldSlugs: [{ type: String }],
  },
  { timestamps: true }
);

propertySchema.index({ owner: 1 });

module.exports = mongoose.model("Property", propertySchema);
