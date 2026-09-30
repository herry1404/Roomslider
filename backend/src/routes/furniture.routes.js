const express = require("express");
const router = express.Router();

const {
  getItems,
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/furniture.controller");

const upload = require("../middleware/upload.middleware");
const { protect } = require("../middleware/auth.middleware");
const { adminOrOwner } = require("../middleware/admin.middleware");

// ===== ADMIN (keep before /:id) =====
router.get("/admin/all", protect, adminOrOwner, getAllItems);
router.post("/", protect, adminOrOwner, upload.array("images", 10), createItem);
router.put("/:id", protect, adminOrOwner, upload.array("images", 10), updateItem);
router.delete("/:id", protect, adminOrOwner, deleteItem);

// ===== PUBLIC =====
router.get("/", getItems);
router.get("/:id", getItemById);

module.exports = router;
