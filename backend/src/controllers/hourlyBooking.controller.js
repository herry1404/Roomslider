const crypto = require("crypto");
const Razorpay = require("razorpay");
const HourlyRoom = require("../models/HourlyRoom.model");
const HourlyBooking = require("../models/HourlyBooking.model");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Check if a room is free for a given time range
// (only "confirmed" bookings block a slot; pending_payment/cancelled don't)
async function isRoomAvailable(roomId, from, to, excludeBookingId = null) {
  const query = {
    room: roomId,
    status: "confirmed",
    bookedFrom: { $lt: to },
    bookedTo: { $gt: from },
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  const clash = await HourlyBooking.findOne(query);
  return !clash;
}

// GET /api/hourly-bookings/check-availability?roomId=&from=&to=
exports.checkAvailability = async (req, res) => {
  try {
    const { roomId, from, to } = req.query;
    if (!roomId || !from || !to) {
      return res.status(400).json({ message: "roomId, from and to are required" });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (fromDate >= toDate) {
      return res.status(400).json({ message: "'to' must be after 'from'" });
    }

    const room = await HourlyRoom.findById(roomId);
    if (!room || !room.isActive || room.status !== "approved") {
      return res.status(404).json({ message: "Room not found" });
    }

    const available = await isRoomAvailable(roomId, fromDate, toDate);
    const hours = (toDate - fromDate) / (1000 * 60 * 60);
    const amount = Math.ceil(hours * room.pricePerHour);

    res.status(200).json({ available, amount, hours });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Toggle a room's manual status (Admin or Hourly Manager) — walk-in / override only
exports.updateRoomAvailability = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { availabilityStatus } = req.body;

    if (!["available", "occupied", "maintenance"].includes(availabilityStatus)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const room = await HourlyRoom.findByIdAndUpdate(
      roomId,
      { availabilityStatus },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json({ message: "Status updated", room });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all approved hourly rooms with their current status (for dashboard)
exports.getAllRoomsWithStatus = async (req, res) => {
  try {
    const rooms = await HourlyRoom.find({ status: "approved", isActive: true });
    res.status(200).json(rooms);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/hourly-bookings/create-order
// Step 1: guest submits details + time range -> we re-check availability,
// compute the amount server-side, create a Razorpay order, and stash a
// pending_payment booking row (not yet confirmed).
exports.createBookingOrder = async (req, res) => {
  try {
    const {
      roomId,
      guestName,
      guestPhone,
      idProofType,
      idProofNumber,
      bookedFrom,
      bookedTo,
    } = req.body;

    const idProofPhotoUrl = req.file?.path;

    if (!roomId || !guestName || !guestPhone || !idProofType || !idProofNumber || !idProofPhotoUrl || !bookedFrom || !bookedTo) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const fromDate = new Date(bookedFrom);
    const toDate = new Date(bookedTo);

    if (fromDate >= toDate || fromDate < new Date()) {
      return res.status(400).json({ message: "Invalid booking time range" });
    }

    const room = await HourlyRoom.findById(roomId);
    if (!room || !room.isActive || room.status !== "approved") {
      return res.status(404).json({ message: "Room not found" });
    }

    const available = await isRoomAvailable(roomId, fromDate, toDate);
    if (!available) {
      return res.status(400).json({ message: "Room already booked for this time" });
    }

    const hours = (toDate - fromDate) / (1000 * 60 * 60);
    const amount = Math.ceil(hours * room.pricePerHour);

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `hb_${roomId.slice(-8)}_${Date.now()}`.slice(0, 40),
    });

    const booking = await HourlyBooking.create({
      guest: req.user._id,
      room: roomId,
      guestName,
      guestPhone,
      idProofType,
      idProofNumber,
      idProofPhotoUrl,
      bookedFrom: fromDate,
      bookedTo: toDate,
      amount,
      razorpayOrderId: order.id,
      status: "pending_payment",
      paymentStatus: "pending",
    });

    res.status(200).json({
      success: true,
      bookingId: booking._id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("CREATE BOOKING ORDER ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/hourly-bookings/verify-payment
// Step 2: verify Razorpay signature, re-check the slot is still free
// (in case two people paid for the same overlapping slot at once),
// then confirm the booking. If the slot got taken meanwhile, we do NOT
// confirm — money has been captured by Razorpay so this is flagged for
// manual refund by admin (kept simple for now: marked failed+note).
exports.verifyBookingPayment = async (req, res) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const booking = await HourlyBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: "Order mismatch" });
    }

    const stillAvailable = await isRoomAvailable(
      booking.room,
      booking.bookedFrom,
      booking.bookedTo,
      booking._id
    );

    if (!stillAvailable) {
      booking.paymentStatus = "paid";
      booking.status = "cancelled";
      await booking.save();
      return res.status(409).json({
        message: "Slot got booked by someone else during payment. Contact support for a refund.",
        booking,
      });
    }

    booking.razorpayPaymentId = razorpay_payment_id;
    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    await booking.save();

    res.status(200).json({ message: "Booking confirmed", booking });
  } catch (err) {
    console.error("VERIFY BOOKING PAYMENT ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all bookings (Admin / Hourly Manager dashboard)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await HourlyBooking.find()
      .populate("room", "title pricePerHour")
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Mark a confirmed booking as completed (checkout done)
exports.completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await HourlyBooking.findByIdAndUpdate(
      bookingId,
      {
        status: "completed",
        handledBy: req.user._id,
        handledByModel: req.user.role === "hourlyManager" ? "HourlyRoomManager" : "User",
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ message: "Booking marked completed", booking });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Guest cancels their own booking (>1 hour before start = 10% cut refund)
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await HourlyBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (String(booking.guest) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your booking" });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: "Only confirmed bookings can be cancelled" });
    }

    const oneHourBeforeStart = new Date(booking.bookedFrom.getTime() - 60 * 60 * 1000);
    if (new Date() > oneHourBeforeStart) {
      return res.status(400).json({ message: "Cancellation window closed (must cancel 1 hour before start)" });
    }

    const cutPercent = 10;
    const refundAmount = Math.floor(booking.amount * (1 - cutPercent / 100));

    if (booking.razorpayPaymentId) {
      await razorpay.payments.refund(booking.razorpayPaymentId, {
        amount: Math.round(refundAmount * 100),
      });
    }

    booking.status = "cancelled";
    booking.paymentStatus = "refunded";
    booking.cancelledAt = new Date();
    booking.refundAmount = refundAmount;
    booking.cancellationCutPercent = cutPercent;
    await booking.save();

    res.status(200).json({ message: "Booking cancelled, refund processed", booking });
  } catch (err) {
    console.error("CANCEL BOOKING ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
