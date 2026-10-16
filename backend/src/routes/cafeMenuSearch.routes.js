const express = require("express");
const rateLimit = require("express-rate-limit");
const { postCafeMenuSearch } = require("../controllers/cafeMenuSearch.controller");

const router = express.Router();
const menuSearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many cafe menu searches. Please try again shortly." },
});

router.post("/", menuSearchLimiter, postCafeMenuSearch);

module.exports = router;
