const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
  getOverdueTenants,
  sendBulkReminders,
  getMyNotifications,
  markNotificationRead,
} = require("../controllers/notification.controller");

// Owner routes
router.get("/overdue-tenants", protect, getOverdueTenants);
router.post("/send-reminders", protect, sendBulkReminders);

// Tenant routes
router.get("/my-notifications", protect, getMyNotifications);
router.put("/:id/read", protect, markNotificationRead);

module.exports = router;
