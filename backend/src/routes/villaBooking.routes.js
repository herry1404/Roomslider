const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");
const {
  checkAvailability,
  createBookingOrder,
  verifyBookingPayment,
  getAdminBookings,
  getMyBookings,
  completeBooking,
} = require("../controllers/villaBooking.controller");

router.get("/check-availability", checkAvailability);
router.get("/mine", protect, getMyBookings);
router.get("/admin/all", protect, adminOnly, getAdminBookings);
router.patch("/admin/:id/complete", protect, adminOnly, completeBooking);
router.post("/create-order", protect, createBookingOrder);
router.post("/verify-payment", protect, verifyBookingPayment);

module.exports = router;
