const mongoose = require("mongoose");

const DAYS = ["Daily", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const scheduleSchema = new mongoose.Schema({
  days: [{ type: String, enum: DAYS }],
  startTime: { type: String, default: "" },
  endTime: { type: String, default: "" },
  details: { type: String, default: "", maxlength: 300 },
}, { _id: false });

const socialPlaceSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["free-food", "blood", "shelter", "medical", "helpline", "scholarship", "volunteer"],
    required: true,
    index: true,
  },
  subType: { type: String, default: "", index: true },
  name: { type: String, required: true, trim: true, maxlength: 150 },
  slug: { type: String, unique: true, sparse: true, index: true },
  area: { type: String, required: true, trim: true, maxlength: 100, index: true },
  address: { type: String, required: true, trim: true, maxlength: 400 },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: {
      type: [Number],
      default: undefined,
      validate: {
        validator: (coordinates) => !coordinates || (
          coordinates.length === 2 &&
          Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1]) &&
          Math.abs(coordinates[0]) <= 180 && Math.abs(coordinates[1]) <= 90
        ),
        message: "Location must contain valid longitude and latitude",
      },
    },
  },
  mapLink: { type: String, default: "", maxlength: 500 },
  organizer: { type: String, default: "", maxlength: 150 },
  description: { type: String, default: "", maxlength: 2000 },
  contactNumber: { type: String, default: "", maxlength: 40 },
  alternateNumber: { type: String, default: "", maxlength: 40 },
  isOpen24x7: { type: Boolean, default: false },
  schedule: { type: [scheduleSchema], default: [] },
  eventDate: { type: Date, default: null, index: true },
  eventEndDate: { type: Date, default: null },
  whoCanCome: { type: String, default: "", maxlength: 500 },
  notes: { type: String, default: "", maxlength: 1000 },
  extra: { type: mongoose.Schema.Types.Mixed, default: {} },
  isVerified: { type: Boolean, default: false },
  lastVerifiedAt: { type: Date, default: null },
  isActive: { type: Boolean, default: false, index: true },
}, { timestamps: true });

socialPlaceSchema.index({ location: "2dsphere" });
socialPlaceSchema.index({ category: 1, subType: 1, isActive: 1 });

module.exports = mongoose.model("SocialPlace", socialPlaceSchema);
