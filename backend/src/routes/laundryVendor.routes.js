const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");

const {
  createVendor,
  getAllVendors,
  updateVendor,
  deleteVendor,
  getPublicVendors,
  getPublicVendor,
} = require("../controllers/laundryVendor.controller");

// Public location-based vendor directory and individual vendor profile.
router.get("/public", getPublicVendors);
router.get("/public/:id", getPublicVendor);

// Admin CRUD
router.get("/", protect, adminOnly, getAllVendors);
router.post("/", protect, adminOnly, createVendor);
router.put("/:id", protect, adminOnly, updateVendor);
router.delete("/:id", protect, adminOnly, deleteVendor);

module.exports = router;
