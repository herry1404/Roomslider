const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
);

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
    images: { type: [String], default: [] },
    images: { type: [String], default: [] },

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

messSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model("Mess", messSchema);
