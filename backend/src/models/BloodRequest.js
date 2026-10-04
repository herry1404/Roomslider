const mongoose = require("mongoose");

const bloodHelperSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  respondedAt: { type: Date, default: Date.now },
}, { _id: false });

const bloodRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  patientName: { type: String, required: true, trim: true, maxlength: 100 },
  bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], required: true, index: true },
  unitsNeeded: { type: Number, required: true, min: 1, max: 20 },
  hospitalName: { type: String, required: true, trim: true, maxlength: 180 },
  area: { type: String, required: true, trim: true, maxlength: 100, index: true },
  address: { type: String, default: "", trim: true, maxlength: 500 },
  neededBy: { type: Date, required: true, index: true },
  urgency: { type: String, enum: ["critical", "urgent", "planned"], required: true },
  contactName: { type: String, required: true, trim: true, maxlength: 100 },
  contactNumber: { type: String, required: true, trim: true, maxlength: 25 },
  contactShareConsent: { type: Boolean, required: true, default: false },
  contactShareConsentAt: { type: Date, default: null },
  note: { type: String, default: "", trim: true, maxlength: 1000 },
  status: { type: String, enum: ["pending", "approved", "fulfilled", "closed", "rejected", "expired"], default: "pending", index: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  approvedAt: { type: Date, default: null },
  rejectReason: { type: String, default: "", maxlength: 500 },
  helpers: { type: [bloodHelperSchema], default: [], select: false },
  notifiedDonors: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [], select: false },
  notAvailableDonors: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [], select: false },
  notifiedCount: { type: Number, default: 0 },
}, { timestamps: true });

bloodRequestSchema.index({ requester: 1, createdAt: -1 });
bloodRequestSchema.index({ status: 1, neededBy: 1 });

module.exports = mongoose.model("BloodRequest", bloodRequestSchema);
