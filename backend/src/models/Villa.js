const mongoose = require("mongoose");

const villaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    address: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, default: "Indore" },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coordinates) =>
            coordinates.length === 2 &&
            coordinates.every(Number.isFinite) &&
            Math.abs(coordinates[0]) <= 180 &&
            Math.abs(coordinates[1]) <= 90,
          message: "Valid longitude and latitude are required",
        },
      },
    },
    nightlyRate: { type: Number, required: true, min: 1 },
    eventRate: { type: Number, required: true, min: 1 },
    maxGuests: { type: Number, required: true, min: 1, max: 500 },
    bedrooms: { type: Number, default: 1, min: 0 },
    bathrooms: { type: Number, default: 1, min: 0 },
    amenities: [{ type: String, trim: true }],
    images: [{ type: String }],
    isActive: { type: Boolean, default: true },
    bookingLockToken: { type: String, default: null, select: false },
    bookingLockUntil: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

villaSchema.index({ location: "2dsphere" });
villaSchema.index({ isActive: 1, createdAt: -1 });
villaSchema.index({ slug: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Villa", villaSchema);
