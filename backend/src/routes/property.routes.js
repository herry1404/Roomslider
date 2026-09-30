const express = require("express");
const router = express.Router();

const {
  getMyProperties,
  createProperty,
  updateProperty,
  getPublicProperty,
} = require("../controllers/property.controller");

const { protect } = require("../middleware/auth.middleware");
const { adminOrOwner } = require("../middleware/admin.middleware");

// "/mine" pehle, warna "/:id" isse "mine" samajh lega
router.get("/mine", protect, adminOrOwner, getMyProperties);
router.post("/", protect, adminOrOwner, createProperty);
router.put("/:id", protect, adminOrOwner, updateProperty);

// Public
router.get("/:id", getPublicProperty);

module.exports = router;
