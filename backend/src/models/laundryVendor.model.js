const mongoose = require("mongoose");

const laundryVendorSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      default: null,
    },
    vendorName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    whatsapp: {
      type: String,
      trim: true,
      default: "",
    },
    area: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: undefined,
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
    },
    catalog: [
      {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

laundryVendorSchema.index({ location: "2dsphere" });
laundryVendorSchema.index({ slug: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("LaundryVendor", laundryVendorSchema);
