const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const LoyaltyCafe = require("../models/LoyaltyCafe");

const staffPinLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req, res) => Boolean(res.locals.staffPinVerified) || res.statusCode < 400,
  keyGenerator: (req) => `${req.params.slug}:${ipKeyGenerator(req.ip)}`,
  message: { success: false, code: "pin_rate_limited", message: "Too many incorrect PIN attempts. Try again in 10 minutes." },
});

const staffPinAuth = async (req, res, next) => {
  try {
    const cafe = await LoyaltyCafe.findOne({ slug: String(req.params.slug || "").toLowerCase(), active: true })
      .select("+staffPinHash")
      .lean();
    if (!cafe) return res.status(404).json({ success: false, message: "Loyalty trial is unavailable." });
    const pin = req.get("x-staff-pin");
    if (typeof pin !== "string" || !pin || !await bcrypt.compare(pin, cafe.staffPinHash)) {
      return res.status(401).json({ success: false, code: "invalid_staff_pin", message: "Staff PIN is incorrect." });
    }
    res.locals.staffPinVerified = true;
    req.loyaltyCafe = { slug: cafe.slug, isDemo: cafe.isDemo };
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { staffPinAuth, staffPinLimiter };
