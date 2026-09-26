const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");

const {
  createBooking,
  getMyBookings,
  getBookedSlots,
  getAllBookings,
  updateBookingStatus,
} = require("../controllers/vehicleBooking.controller");

// ===== PUBLIC =====
router.get("/vehicle/:vehicleId/slots", getBookedSlots);

// ===== LOGGED-IN USER =====
router.post("/", protect, createBooking);
router.get("/my", protect, getMyBookings);

// ===== ADMIN ONLY =====
router.get("/", protect, adminOnly, getAllBookings);
router.put("/:id/status", protect, adminOnly, updateBookingStatus);

module.exports = router;
