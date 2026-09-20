const rateLimit = require("express-rate-limit");

// Limits account creation per IP (counts every request, not just failures)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Bahut zyada accounts ban rahe hain, thodi der baad try karo.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = registerLimiter;
