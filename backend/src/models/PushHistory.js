const mongoose = require("mongoose");

const pushHistorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 100 },
    message: { type: String, required: true, maxlength: 500 },
    hiTitle: { type: String, default: "", maxlength: 100 },
    hiMessage: { type: String, default: "", maxlength: 500 },
    link: { type: String, default: "/" },
    image: { type: String, default: "" },
    audience: { type: String, enum: ["all", "owners", "students"], required: true },
    recipientCount: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PushHistory", pushHistorySchema);
