const express = require("express");
const router = express.Router();

const {
  createShop,
  getMyShops,
  getAllShops,
} = require("../controllers/vehicleShop.controller");

const upload = require("../middleware/upload.middleware");
const { protect } = require("../middleware/auth.middleware");
const { adminOrOwner } = require("../middleware/admin.middleware");

// ===== PUBLIC =====

// Get all active vehicle shops
router.get("/", getAllShops);

// ===== ADMIN OR OWNER =====

// Create a new vehicle shop (with images)
router.post("/", protect, adminOrOwner, upload.array("images", 10), createShop);

// Get shops owned by logged-in user
router.get("/my", protect, adminOrOwner, getMyShops);

module.exports = router;
