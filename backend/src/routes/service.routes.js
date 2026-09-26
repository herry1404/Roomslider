const express = require("express");
const router = express.Router();

const {
  createProvider,
  getProvidersByCategory,
  getAllProviders,
  updateProvider,
  deleteProvider,
} = require("../controllers/service.controller");

const upload = require("../middleware/upload.middleware");
const { protect } = require("../middleware/auth.middleware");
const { adminOrOwner } = require("../middleware/admin.middleware");

// ===== ADMIN OR OWNER =====
router.get("/", protect, adminOrOwner, getAllProviders);
router.post("/", protect, adminOrOwner, upload.array("images", 10), createProvider);
router.put("/:id", protect, adminOrOwner, updateProvider);
router.delete("/:id", protect, adminOrOwner, deleteProvider);

// ===== PUBLIC =====
router.get("/:category", getProvidersByCategory);

module.exports = router;
