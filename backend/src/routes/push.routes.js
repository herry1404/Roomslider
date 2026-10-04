const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { savePushSubscription, removePushSubscription, getPushConfig } = require("../controllers/notification.controller");

router.get("/config", getPushConfig);
router.post("/subscribe", protect, savePushSubscription);
router.post("/unsubscribe", protect, removePushSubscription);

module.exports = router;
