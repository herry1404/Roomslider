const express = require("express");
const router = express.Router();

const {
  createVehicle,
  getVehiclesByShop,
  getSingleVehicle,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicle.controller");

const { protect } = require("../middleware/auth.middleware");
const { adminOrOwner } = require("../middleware/admin.middleware");

// ===== PUBLIC =====
router.get("/shop/:shopId", getVehiclesByShop);
router.get("/:id", getSingleVehicle);

// ===== ADMIN OR OWNER =====
router.post("/", protect, adminOrOwner, createVehicle);
router.put("/:id", protect, adminOrOwner, updateVehicle);
router.delete("/:id", protect, adminOrOwner, deleteVehicle);

module.exports = router;
