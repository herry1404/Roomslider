const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");
const upload = require("../middleware/upload.middleware");
const { sendPushBroadcast, listPushHistory } = require("../controllers/notification.controller");
const {
  setRoomVerification,
  setOwnerVerification,
  listListingReports,
  setListingReportStatus,
} = require("../controllers/trustSafety.controller");

const {
  getDashboard,
  getAnalytics,
  getAllUsers,
  deleteUser,
} = require("../controllers/admin.controller");
const {
  getAdminAlerts,
  markAdminAlertRead,
  markAllAdminAlertsRead,
  subscribeAdminPush,
  unsubscribeAdminPush,
} = require("../controllers/adminAlert.controller");

// ===============================
// Dashboard
// ===============================

router.get(
  "/dashboard",
  protect,
  adminOnly,
  getDashboard
);

router.get("/analytics", protect, adminOnly, getAnalytics);
router.get("/alerts", protect, adminOnly, getAdminAlerts);
router.patch("/alerts/read-all", protect, adminOnly, markAllAdminAlertsRead);
router.patch("/alerts/:id/read", protect, adminOnly, markAdminAlertRead);
router.post("/push/subscribe", protect, adminOnly, subscribeAdminPush);
router.delete("/push/unsubscribe", protect, adminOnly, unsubscribeAdminPush);

// ===============================
// Get All Users
// ===============================

router.get(
  "/users",
  protect,
  adminOnly,
  getAllUsers
);

// ===============================
// Delete User
// ===============================

router.delete(
  "/users/:id",
  protect,
  adminOnly,
  deleteUser
);

router.post("/push/send", protect, adminOnly, upload.single("image"), sendPushBroadcast);
router.get("/push/history", protect, adminOnly, listPushHistory);
router.patch("/rooms/:id/verification", protect, adminOnly, setRoomVerification);
router.patch("/owners/:id/verification", protect, adminOnly, setOwnerVerification);
router.get("/listing-reports", protect, adminOnly, listListingReports);
router.patch("/listing-reports/:id", protect, adminOnly, setListingReportStatus);

module.exports = router;