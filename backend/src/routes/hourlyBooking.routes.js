const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const uploadHourlyBookingId = require("../middleware/uploadHourlyBooking.middleware");
const {
  checkAvailability,
  updateRoomAvailability,
  getAllRoomsWithStatus,
  createBookingOrder,
  verifyBookingPayment,
  getAllBookings,
  completeBooking,
  cancelBooking,
} = require("../controllers/hourlyBooking.controller");

// Helper: allow only admin or hourlyManager
const staffOnly = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "hourlyManager") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

// Rooms (staff dashboard use — manual override toggle)
router.get("/rooms", protect, staffOnly, getAllRoomsWithStatus);
router.patch("/rooms/:roomId/status", protect, staffOnly, updateRoomAvailability);

// Guest booking flow
router.get("/check-availability", protect, checkAvailability);
router.post("/create-order", protect, uploadHourlyBookingId.single("idProofPhoto"), createBookingOrder);
router.post("/verify-payment", protect, verifyBookingPayment);
router.patch("/:bookingId/cancel", protect, cancelBooking);

// Staff dashboard
router.get("/", protect, staffOnly, getAllBookings);
router.patch("/:bookingId/complete", protect, staffOnly, completeBooking);

module.exports = router;
