const mongoose = require("mongoose");

const roommatePreferencesSchema = new mongoose.Schema(
  {
    setupComplete: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    seeking: {
      type: String,
      enum: ["room", "roommate", "both"],
      default: "both",
    },
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
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

        password: {
      type: String,
      required: function(){ return !this.googleId; },
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // USER / ADMIN CONTROL
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },


    // Wishlist Rooms
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
      },
    ],

    // The room this user is currently renting as a tenant (set when an
    // owner assigns them to a room, cleared on vacate)
    activeRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },

    // Preferred college and area, set via onboarding popup, used to
    // order/label rooms on the map by distance from this reference point
    preferredCollege: {
      type: String,
      default: null,
    },

    preferredArea: {
      type: String,
      default: null,
    },

    // Public profile
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },

    bio: {
      type: String,
      maxlength: 150,
      default: "",
    },

    avatar: {
      type: String,
      default: null,
    },

    // Bio data (private, shown only to the user)
    occupation: {
      type: String,
      default: "",
      trim: true,
    },

    organization: {
      type: String,
      default: "",
      trim: true,
    },

    course: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    subject: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    studyYear: {
      type: String,
      default: "",
      trim: true,
      maxlength: 40,
    },

    gender: {
      type: String,
      default: "",
      trim: true,
    },

    dob: {
      type: Date,
      default: null,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    area: {
      type: String,
      default: "",
      trim: true,
    },

    hometown: {
      type: String,
      default: "",
      trim: true,
    },

    roommatePreferences: {
      type: roommatePreferencesSchema,
      default: undefined,
    },

    bloodGroup: {
      type: String,
      enum: ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: "",
    },
    bloodDonorConsent: { type: Boolean, default: false },
    bloodDonorConsentAt: { type: Date, default: null },
    bloodDonorAvailable: { type: Boolean, default: true },
    lastDonatedAt: { type: Date, default: null },
    bloodRequestsBlocked: { type: Boolean, default: false, select: false },
    isActive: { type: Boolean, default: true, select: false },
    isBlocked: { type: Boolean, default: false, select: false },
    notificationPrefs: {
      chat: { type: Boolean, default: true },
      booking: { type: Boolean, default: true },
      offers: { type: Boolean, default: true },
      blood: { type: Boolean, default: true },
      alerts: { type: Boolean, default: true },
    },
    preferredLanguage: { type: String, enum: ["en", "hi-en"], default: "en" },

  },
  {
    timestamps: true,
  }
);


module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);