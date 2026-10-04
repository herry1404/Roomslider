const mongoose = require("mongoose");

const savedSearchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    area: { type: String, required: true, trim: true, maxlength: 80 },
    areaNormalized: { type: String, required: true, lowercase: true, trim: true },
    category: { type: String, enum: ["Any", "Room", "PG", "Hostel", "Flat"], default: "Any" },
    maxPrice: { type: Number, min: 0, default: 0 },
    gender: { type: String, enum: ["Any", "Male", "Female"], default: "Any" },
  },
  { timestamps: true }
);

savedSearchSchema.index(
  { user: 1, areaNormalized: 1, category: 1, maxPrice: 1, gender: 1 },
  { unique: true }
);
savedSearchSchema.index({ category: 1, maxPrice: 1, gender: 1 });

module.exports = mongoose.model("SavedSearch", savedSearchSchema);
