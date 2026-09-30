const express = require("express");
const router = express.Router();

const {
  getPublicSections,
  getAllSections,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
} = require("../controllers/homeSection.controller");

const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");

// ===== PUBLIC =====
router.get("/", getPublicSections);

// ===== ADMIN ONLY =====
router.get("/admin/all", protect, adminOnly, getAllSections);
router.post("/", protect, adminOnly, createSection);
router.put("/reorder", protect, adminOnly, reorderSections);
router.put("/:id", protect, adminOnly, updateSection);
router.delete("/:id", protect, adminOnly, deleteSection);

module.exports = router;
