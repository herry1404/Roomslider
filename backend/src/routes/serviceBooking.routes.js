const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");
const uploadLoan = require("../middleware/uploadLoan.middleware");

const {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  getNewBookingCount,
} = require("../controllers/serviceBooking.controller");

// ===== LOGGED-IN USER =====
router.post("/", protect, uploadLoan.single("idPhoto"), createBooking);
router.get("/mine", protect, getMyBookings);
router.get("/my", protect, getMyBookings);

// ===== ADMIN ONLY =====
router.get("/", protect, adminOnly, getAllBookings);
router.get("/new-count", protect, adminOnly, getNewBookingCount);
router.put("/:id/status", protect, adminOnly, updateBookingStatus);

module.exports = router;
