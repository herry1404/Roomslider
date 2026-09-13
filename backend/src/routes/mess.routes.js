const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");

const {
  messLogin,
  createMess,
  getAllMess,
  getSingleMess,
  updateMess,
  deleteMess,
  getNearbyMess,
  getMessDetail,
  updateTodayMenu,
  getMyMessDashboard,
} = require("../controllers/mess.controller");

// ===============================
// Public
// ===============================
router.post("/login", messLogin);
router.get("/nearby", getNearbyMess);
router.get("/public/:id", getMessDetail);

// ===============================
// Mess Owner (protected)
// ===============================
router.get("/me", protect, getMyMessDashboard);
router.put("/me/menu", protect, updateTodayMenu);

// ===============================
// Admin only
// ===============================
router.post("/", protect, adminOnly, createMess);
router.get("/", protect, adminOnly, getAllMess);
router.get("/:id", protect, adminOnly, getSingleMess);
router.put("/:id", protect, adminOnly, updateMess);
router.delete("/:id", protect, adminOnly, deleteMess);

module.exports = router;
