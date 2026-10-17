const express = require("express");
const rateLimit = require("express-rate-limit");
const controller = require("../controllers/loyalty.controller");
const { staffPinAuth, staffPinLimiter } = require("../middleware/loyaltyStaffAuth");

const router = express.Router();
const cardCreateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many card creation attempts. Try again later." },
});

router.post("/:slug/cards", cardCreateLimiter, controller.createCard);
router.get("/:slug/card", controller.getCard);
router.post("/:slug/spin", controller.spin);
router.use("/:slug/staff", staffPinLimiter, staffPinAuth);
router.post("/:slug/staff/lookup", controller.lookup);
router.post("/:slug/staff/stamp", controller.stamp);
router.post("/:slug/staff/redeem", controller.redeem);
router.post("/:slug/staff/demo-reset", controller.demoReset);

module.exports = router;
