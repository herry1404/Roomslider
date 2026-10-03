const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Student details
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    dob: { type: Date },
    address: { type: String, trim: true, maxlength: 500 },
    addressDetails: {
      houseNumber: { type: String, trim: true, maxlength: 100 },
      area: { type: String, trim: true, maxlength: 100 },
      nearby: { type: String, trim: true, maxlength: 100 },
      city: { type: String, trim: true, maxlength: 80 },
      state: { type: String, trim: true, maxlength: 80 },
      postalCode: { type: String, trim: true, maxlength: 10 },
    },
    currentLocation: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
    },

    // Loan details
    amount: { type: Number, required: true, min: 0 },
    purpose: {
      type: String,
      enum: ["rent", "deposit", "fees", "other"],
      default: "other",
    },
    note: { type: String, trim: true, maxlength: 500 },

    // Education
    college: { type: String, trim: true, maxlength: 150 },
    course: { type: String, trim: true, maxlength: 150 },

    // KYC / eligibility
    pan: { type: String, trim: true, uppercase: true, maxlength: 10 },
    guardianName: { type: String, trim: true, maxlength: 100 },
    guardianPhone: { type: String, trim: true },
    guardianOccupation: { type: String, trim: true, maxlength: 100 },
    familyIncomeRange: {
      type: String,
      enum: ["below_2l", "2l_5l", "5l_10l", "above_10l"],
    },
    idType: {
      type: String,
      enum: ["aadhaar", "voter_id", "driving_license", "college_id"],
    },
    idPhotoUrl: { type: String, default: null },
    idPhotoPublicId: { type: String, default: null },
    consentGiven: { type: Boolean, required: true, default: false },

    status: {
      type: String,
      enum: ["new", "submitted", "under_review", "contacted", "approved", "rejected"],
      default: "submitted",
      index: true,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["new", "submitted", "under_review", "contacted", "approved", "rejected"],
          required: true,
        },
        message: { type: String, trim: true, maxlength: 300 },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Loan", loanSchema);
