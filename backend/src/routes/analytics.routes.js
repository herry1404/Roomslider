const express = require("express");
const rateLimit = require("express-rate-limit");
const { trackPageView, trackPageDuration } = require("../controllers/siteAnalytics.controller");
const { getOwnerAnalytics, getAdminAnalytics } = require("../controllers/analyticsEvent.controller");
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
