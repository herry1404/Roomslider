const express = require("express");
const rateLimit = require("express-rate-limit");
const { trackPageView } = require("../controllers/siteAnalytics.controller");

const router = express.Router();
const pageViewLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many analytics events. Please try again shortly." },
});

router.post("/page-view", pageViewLimiter, trackPageView);

module.exports = router;
