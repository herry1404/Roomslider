const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");
const {
  getPublicAds,
  listAds,
  createAd,
  updateAd,
  toggleAd,
  deleteAd,
} = require("../controllers/ad.controller");
const {
  trackCafeMenuEvent,
  getCafeMenuAnalytics,
} = require("../controllers/cafeMenuAnalytics.controller");

const router = express.Router();
const publicAdLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many ad requests. Please try again shortly." },
});

router.get("/", publicAdLimiter, getPublicAds);
router.post("/analytics", publicAdLimiter, trackCafeMenuEvent);
router.get("/admin", protect, adminOnly, listAds);
router.get("/admin/analytics", protect, adminOnly, getCafeMenuAnalytics);
router.post("/admin", protect, adminOnly, createAd);
router.put("/admin/:id", protect, adminOnly, updateAd);
router.patch("/admin/:id/active", protect, adminOnly, toggleAd);
router.delete("/admin/:id", protect, adminOnly, deleteAd);

module.exports = router;
