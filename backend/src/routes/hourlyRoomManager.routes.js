const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");
const {
  createManager,
  loginManager,
  getAllManagers,
} = require("../controllers/hourlyRoomManager.controller");

// Public
router.post("/login", loginManager);

// Admin only
router.post("/", protect, adminOnly, createManager);
router.get("/", protect, adminOnly, getAllManagers);

module.exports = router;
