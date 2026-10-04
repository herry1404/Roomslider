const mongoose = require("mongoose");

const roommateReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reported: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
  },
  { timestamps: true }
);

roommateReportSchema.index({ reporter: 1, reported: 1 }, { unique: true });

module.exports =
  mongoose.models.RoommateReport ||
  mongoose.model("RoommateReport", roommateReportSchema);
