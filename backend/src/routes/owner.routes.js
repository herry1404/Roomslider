const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");

const {
  createOwner,
  ownerLogin,
  getAllOwners,
  getSingleOwner,
  getMyRooms,
  updateOwner,
  deleteOwner,
} = require("../controllers/owner.controller");

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
router.get("/me", protect, getMyRooms);
router.get("/:id", protect, adminOnly, getSingleOwner);

// ===============================
// Update Owner
// ===============================
router.put("/:id", protect, adminOnly, updateOwner);

// ===============================
// Delete Owner
// ===============================
router.delete("/:id", protect, adminOnly, deleteOwner);

module.exports = router;
