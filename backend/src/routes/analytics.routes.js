const express = require("express");
const rateLimit = require("express-rate-limit");
const { trackPageView, trackPageDuration } = require("../controllers/siteAnalytics.controller");
const { getOwnerAnalytics, getAdminAnalytics } = require("../controllers/analyticsEvent.controller");
const { track, getLive, getOverview, getCafeAnalytics } = require("../controllers/analytics.controller");
const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");

const router = express.Router();
const pageViewLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many analytics events. Please try again shortly." },
});
const eventTrackerLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 240,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many analytics events" },
});

router.post("/track", eventTrackerLimiter, express.text({ type: "text/plain", limit: "8kb" }), require("../middleware/auth.middleware").optionalAuth, track);
router.get("/live", protect, adminOnly, getLive);
router.get("/admin/overview", protect, adminOnly, getOverview);
router.get("/owner/overview", protect, (req, res, next) => {
  if (req.user?.role !== "owner") {
    return res.status(403).json({ success: false, message: "Owner access required" });
  }
  return next();
}, getOverview);
router.get("/cafe/:cafeId", protect, adminOnly, getCafeAnalytics);
router.post("/page-view", pageViewLimiter, express.urlencoded({ extended: false }), trackPageView);
router.post("/page-view-duration", pageViewLimiter, express.urlencoded({ extended: false }), trackPageDuration);
router.get("/owner", protect, (req, res, next) => {
  if (req.user?.role !== "owner") {
    return res.status(403).json({ success: false, message: "Owner access required" });
  }
  return next();
}, getOwnerAnalytics);
router.get("/admin", protect, adminOnly, getAdminAnalytics);

module.exports = router;
