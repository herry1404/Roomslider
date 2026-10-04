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
  getAllUsers,
  deleteUser,
} = require("../controllers/admin.controller");

// ===============================
// Dashboard
// ===============================

router.get(
  "/dashboard",
  protect,
  adminOnly,
  getDashboard
);

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