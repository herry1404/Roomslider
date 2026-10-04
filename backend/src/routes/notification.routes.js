const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
  getOverdueTenants,
  sendBulkReminders,
  getMyNotifications,
  markNotificationRead,
  getPushConfig,
  savePushSubscription,
  removePushSubscription,
  sendBroadcast,
  listNotifications,
  getUnreadCount,
  markAllRead,
  deleteNotification,
  createStreamToken,
  notificationStream,
} = require("../controllers/notification.controller");

router.get("/push-config", getPushConfig);
router.put("/push-subscriptions", protect, savePushSubscription);
router.delete("/push-subscriptions", protect, removePushSubscription);
router.post("/broadcast", protect, sendBroadcast);
router.get("/stream-token", protect, createStreamToken);
router.get("/stream", notificationStream);
router.get("/unread-count", protect, getUnreadCount);
router.put("/read-all", protect, markAllRead);
router.get("/", protect, listNotifications);

// Owner routes
router.get("/overdue-tenants", protect, getOverdueTenants);
router.post("/send-reminders", protect, sendBulkReminders);

// Tenant routes
router.get("/my-notifications", protect, getMyNotifications);
router.put("/:id/read", protect, markNotificationRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
