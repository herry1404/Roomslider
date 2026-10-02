const mongoose = require("mongoose");

const roommateProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    active: { type: Boolean, default: true },
    seeking: {
      type: String,
      enum: ["room", "roommate", "both"],
      default: "both",
    },
    bio: { type: String, trim: true, maxlength: 500, default: "" },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    area: { type: String, trim: true, maxlength: 100, default: "" },
    college: { type: String, trim: true, maxlength: 120, default: "" },
    budgetMin: { type: Number, min: 0, default: 0 },
    budgetMax: { type: Number, min: 0, default: 0 },
    moveInDate: { type: Date, default: null },
    sharingType: {
      type: String,
      enum: ["", "Single", "Double", "Triple", "Other"],
      default: "",
    },
    lifestyle: {
      cleanliness: { type: String, enum: ["", "relaxed", "moderate", "very"], default: "" },
      sleepSchedule: { type: String, enum: ["", "early", "flexible", "late"], default: "" },
      smoking: { type: String, enum: ["", "no", "sometimes", "yes"], default: "" },
      guests: { type: String, enum: ["", "rarely", "sometimes", "often"], default: "" },
    },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.RoommateProfile ||
  mongoose.model("RoommateProfile", roommateProfileSchema);
