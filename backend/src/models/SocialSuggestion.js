const mongoose = require("mongoose");

const socialSuggestionSchema = new mongoose.Schema({
  suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  category: { type: String, enum: ["free-food", "blood", "shelter", "medical", "helpline", "scholarship", "volunteer"], required: true },
  subType: { type: String, default: "" },
  name: { type: String, required: true, trim: true, maxlength: 150 },
  area: { type: String, required: true, trim: true, maxlength: 100 },
  address: { type: String, required: true, trim: true, maxlength: 400 },
  contactNumber: { type: String, default: "", maxlength: 40 },
  description: { type: String, default: "", maxlength: 1000 },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

socialSuggestionSchema.index({ suggestedBy: 1, createdAt: -1 });

module.exports = mongoose.model("SocialSuggestion", socialSuggestionSchema);
