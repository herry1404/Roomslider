const express = require("express");
const router = express.Router();

const {
  getMyProperties,
  createProperty,
  createBuilding,
  updateProperty,
  getPublicProperty,
} = require("../controllers/property.controller");

const { protect, optionalAuth } = require("../middleware/auth.middleware");
const { adminOrOwner } = require("../middleware/admin.middleware");

// "/mine" pehle, warna "/:id" isse "mine" samajh lega
router.get("/mine", protect, adminOrOwner, getMyProperties);
router.post("/", protect, adminOrOwner, createProperty);
router.post("/:id/buildings", protect, adminOrOwner, createBuilding);
router.put("/:id", protect, adminOrOwner, updateProperty);

// Public
router.get("/:id", optionalAuth, getPublicProperty);

module.exports = router;
