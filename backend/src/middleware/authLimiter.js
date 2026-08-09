const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  skip: (req) => {
    return req.body?.email === process.env.ADMIN_EMAIL;
  },
  message: {
    success: false,
    message: "Bahut zyada attempts ho gaye, thodi der baad try karo.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = authLimiter;
