const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Student details
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    dob: { type: Date },
    address: { type: String, trim: true, maxlength: 300 },

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
      enum: ["new", "contacted", "approved", "rejected"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Loan", loanSchema);
