const mongoose = require("mongoose");

const listingReportSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, trim: true, minlength: 5, maxlength: 500 },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
  },
  { timestamps: true }
);

listingReportSchema.index({ room: 1, reporter: 1 }, { unique: true });

module.exports = mongoose.model("ListingReport", listingReportSchema);
