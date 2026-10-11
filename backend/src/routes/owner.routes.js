const express = require("express");
const router = express.Router();

const { protect, optionalAuth } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");

const {
  createOwner,
  getPublicOwnerProfile,
  getOwnerProfileBySlug,
  ownerLogin,
  getAllOwners,
  getSingleOwner,
  getMyRooms,
  updateOwner,
  deleteOwner,
} = require("../controllers/owner.controller");
const { getOwnerReels } = require("../controllers/reel.controller");

// ===============================
// Owner Login (public)
// ===============================
router.post("/login", ownerLogin);

// ===============================
// Create Owner
// ===============================
router.post("/", protect, adminOnly, createOwner);

// ===============================
// Get All Owners
// ===============================
router.get("/", protect, adminOnly, getAllOwners);

// ===============================
// Get Single Owner + their rooms
// ===============================
router.get("/public/:id", getPublicOwnerProfile);
router.get("/me", protect, getMyRooms);
router.get("/admin/:id", protect, adminOnly, getSingleOwner);
router.get("/:slug/reels", getOwnerReels);
router.get("/:slug", optionalAuth, getOwnerProfileBySlug);

// ===============================
// Update Owner
// ===============================
router.put("/:id", protect, adminOnly, updateOwner);

// ===============================
// Delete Owner
// ===============================
router.delete("/:id", protect, adminOnly, deleteOwner);

module.exports = router;
