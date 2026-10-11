const mongoose = require("mongoose");

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Owner",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

followSchema.index({ follower: 1, owner: 1 }, { unique: true });

module.exports =
  mongoose.models.Follow || mongoose.model("Follow", followSchema);
