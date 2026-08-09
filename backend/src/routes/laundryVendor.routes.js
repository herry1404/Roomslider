const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");

const {
  createVendor,
  getAllVendors,
  updateVendor,
  deleteVendor,
  getVendorForMyRoom,
} = require("../controllers/laundryVendor.controller");

// Tenant: fetch vendor for their room's owner (query param ownerId)
router.get("/my-vendor", protect, getVendorForMyRoom);

// Admin CRUD
router.get("/", protect, adminOnly, getAllVendors);
router.post("/", protect, adminOnly, createVendor);
router.put("/:id", protect, adminOnly, updateVendor);
router.delete("/:id", protect, adminOnly, deleteVendor);

module.exports = router;
