const express = require("express");
const rateLimit = require("express-rate-limit");
const { optionalAuth } = require("../middleware/auth.middleware");
const { trackEvent } = require("../controllers/analyticsEvent.controller");

const router = express.Router();
const trackerLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many tracking events" },
});

router.post("/", trackerLimiter, optionalAuth, trackEvent);

module.exports = router;
