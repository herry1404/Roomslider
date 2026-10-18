const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");
const uploadAdImage = require("../middleware/uploadAdImage.middleware");
const {
  getPublicAds,
  clickAd,
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
router.get("/:id/click", publicAdLimiter, require("../middleware/auth.middleware").optionalAuth, clickAd);
router.post("/analytics", publicAdLimiter, express.urlencoded({ extended: false }), trackCafeMenuEvent);
router.get("/admin", protect, adminOnly, listAds);
router.get("/admin/analytics", protect, adminOnly, getCafeMenuAnalytics);
router.post("/admin/upload", protect, adminOnly, uploadAdImage.single("image"), async (req, res) => {
  if (!req.file?.path || !req.file.mimetype?.startsWith("image/")) {
    return res.status(400).json({ success: false, message: "Choose a valid image file" });
  }
  return res.status(201).json({ success: true, imageUrl: req.file.path });
});
router.post("/admin", protect, adminOnly, createAd);
router.put("/admin/:id", protect, adminOnly, updateAd);
router.patch("/admin/:id/active", protect, adminOnly, toggleAd);
router.delete("/admin/:id", protect, adminOnly, deleteAd);

module.exports = router;
