const express = require("express");
const controller = require("../controllers/rewards.controller");
const { protect, optionalAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/me", protect, controller.myRewards);
router.get("/:slug", optionalAuth, controller.publicInfo);
router.post("/:slug/checkin", protect, controller.checkIn);
router.post("/:slug/spin", protect, controller.spin);
router.get("/:slug/portal", protect, controller.dashboard);
router.post("/:slug/portal/code/regenerate", protect, controller.regenerateCode);
router.put("/:slug/portal/budget", protect, controller.setBudget);
router.put("/:slug/portal/rewards", protect, controller.updateRewards);
router.post("/:slug/portal/redeem", protect, controller.redeem);

module.exports = router;
