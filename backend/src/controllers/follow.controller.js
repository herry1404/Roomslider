const mongoose = require("mongoose");
const Follow = require("../models/Follow");
const Owner = require("../models/Owner");

const canFollow = (req, res) => {
  if (["user", "admin"].includes(req.user.role)) return true;
  res.status(403).json({ success: false, message: "A user account is required to follow owners" });
  return false;
};

const getOwner = async (ownerId, res) => {
  if (!mongoose.isValidObjectId(ownerId)) {
    res.status(400).json({ success: false, message: "Invalid owner" });
    return null;
  }

  const owner = await Owner.findById(ownerId).select("_id");
  if (!owner) {
    res.status(404).json({ success: false, message: "Owner not found" });
    return null;
  }

  return owner;
};

const followOwner = async (req, res) => {
  try {
    if (!canFollow(req, res)) return;

    const owner = await getOwner(req.params.ownerId, res);
    if (!owner) return;
    if (String(req.user._id) === String(owner._id)) {
      return res.status(400).json({ success: false, message: "You cannot follow yourself" });
    }

    try {
      await Follow.create({ follower: req.user._id, owner: owner._id });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }

    const followersCount = await Follow.countDocuments({ owner: owner._id });
    res.json({ success: true, following: true, followersCount });
  } catch (error) {
    console.error("FOLLOW OWNER ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to follow owner" });
  }
};

const unfollowOwner = async (req, res) => {
  try {
    if (!canFollow(req, res)) return;

    const owner = await getOwner(req.params.ownerId, res);
    if (!owner) return;
    if (String(req.user._id) === String(owner._id)) {
      return res.status(400).json({ success: false, message: "You cannot follow yourself" });
    }

    await Follow.deleteOne({ follower: req.user._id, owner: owner._id });
    const followersCount = await Follow.countDocuments({ owner: owner._id });
    res.json({ success: true, following: false, followersCount });
  } catch (error) {
    console.error("UNFOLLOW OWNER ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to unfollow owner" });
  }
};

module.exports = { followOwner, unfollowOwner };
