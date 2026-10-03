const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const slugify = require("slugify");

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    category: { type: String, trim: true, default: "Other", maxlength: 60 },
    calories: { type: Number, min: 0, default: null },
  },
  { _id: false }
);

const addOnSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  isAvailable: { type: Boolean, default: true },
});

const messSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"],
    },
    password: { type: String, required: true },
    address: { type: String, required: true, trim: true },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        // [longitude, latitude]
        type: [Number],
        required: true,
      },
    },

    pricePerPerson: { type: Number, required: true },
    mealType: { type: String, enum: ["thali", "tiffin"], default: "thali" },
    images: { type: [String], default: [] },
    addOns: { type: [addOnSchema], default: [] },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },

    todayMenu: {
      date: { type: String }, // "YYYY-MM-DD"
      items: [menuItemSchema],
    },

    role: { type: String, default: "mess" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

messSchema.index({ location: "2dsphere" });
messSchema.index({ slug: 1 }, { unique: true, sparse: true });

messSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model("Mess", messSchema);
