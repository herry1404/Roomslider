const express = require("express");
const { protect, optionalAuth } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");
const uploadReelVideo = require("../middleware/uploadReelVideo.middleware");
const {
  getReels,
  getAdminReels,
  getMyReels,
  createReel,
  deleteReel,
  updateReelStatus,
} = require("../controllers/reel.controller");

const router = express.Router();

const ownerOnly = (req, res, next) => {
  if (req.user.role === "owner") return next();
  return res.status(403).json({ success: false, message: "Owner account required" });
};

router.get("/", getReels);
router.get("/admin", protect, adminOnly, getAdminReels);
router.get("/me", protect, getMyReels);
router.post("/", protect, ownerOnly, uploadReelVideo, createReel);
router.patch("/:id/status", protect, adminOnly, updateReelStatus);
router.delete("/:id", protect, deleteReel);

module.exports = router;
