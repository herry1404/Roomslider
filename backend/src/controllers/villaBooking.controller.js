const crypto = require("crypto");
const Razorpay = require("razorpay");
const Villa = require("../models/Villa");
const VillaBooking = require("../models/VillaBooking");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const HOLD_MINUTES = 15;
const LOCK_MILLISECONDS = 2 * 60 * 1000;
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

const parseDateRange = (bookingType, startValue, endValue) => {
  if (
    typeof startValue !== "string" ||
    typeof endValue !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startValue) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endValue)
  ) return null;
  const startDate = new Date(`${startValue}T00:00:00.000Z`);
  let endDate = new Date(`${endValue}T00:00:00.000Z`);
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) return null;
  if (
    startDate.toISOString().slice(0, 10) !== startValue ||
    endDate.toISOString().slice(0, 10) !== endValue
  ) return null;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (bookingType === "event" && endDate.getTime() === startDate.getTime()) {
    endDate = new Date(startDate.getTime() + DAY_MILLISECONDS);
  }
  if (startDate < today || endDate <= startDate) return null;
  const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / DAY_MILLISECONDS);
  return { startDate, endDate, dayCount };
};

const slotAvailable = async (villaId, startDate, endDate, excludeId) => {
  const query = {
    villa: villaId,
    status: { $in: ["confirmed", "pending_payment"] },
    $or: [
      { status: "confirmed" },
      { status: "pending_payment", pendingExpiresAt: { $gt: new Date() } },
    ],
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return !(await VillaBooking.exists(query));
};

const acquireVillaLock = async (villaId, token) => {
  const now = new Date();
  const result = await Villa.updateOne(
    {
      _id: villaId,
      $or: [
        { bookingLockUntil: null },
        { bookingLockUntil: { $exists: false } },
        { bookingLockUntil: { $lt: now } },
      ],
    },
    {
      $set: {
        bookingLockToken: token,
        bookingLockUntil: new Date(now.getTime() + LOCK_MILLISECONDS),
      },
    }
  );
  return result.modifiedCount === 1;
};

const releaseVillaLock = async (villaId, token) => {
  await Villa.updateOne(
    { _id: villaId, bookingLockToken: token },
    { $set: { bookingLockToken: null, bookingLockUntil: null } }
  );
};

const validSignature = (orderId, paymentId, signature) => {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature || "");
  return expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

exports.checkAvailability = async (req, res) => {
  try {
    const { villaId, bookingType, startDate: from, endDate: to, guestCount } = req.query;
    if (!villaId || !["stay", "event"].includes(bookingType)) {
      return res.status(400).json({ success: false, message: "villaId and a valid bookingType are required" });
    }
    const range = parseDateRange(bookingType, from, to);
    if (!range) return res.status(400).json({ success: false, message: "Choose valid future dates" });
    const villa = await Villa.findOne({ _id: villaId, isActive: true });
    if (!villa) return res.status(404).json({ success: false, message: "Villa not found" });
    const guests = Number(guestCount);
    if (!Number.isInteger(guests) || guests < 1 || guests > villa.maxGuests) {
      return res.status(400).json({ success: false, message: `Guest count must be between 1 and ${villa.maxGuests}` });
    }
    const available = await slotAvailable(villa._id, range.startDate, range.endDate);
    const rate = bookingType === "event" ? villa.eventRate : villa.nightlyRate;
    res.status(200).json({
      success: true,
      available,
      bookingType,
      dayCount: range.dayCount,
      rate,
      amount: rate * range.dayCount,
      maxGuests: villa.maxGuests,
    });
  } catch (error) {
    console.error("CHECK VILLA AVAILABILITY ERROR:", error);
    res.status(500).json({ success: false, message: "Availability check failed" });
  }
};

exports.createBookingOrder = async (req, res) => {
  let lockToken;
  let villaId;
  try {
    const { villaId: requestedVillaId, bookingType, startDate: from, endDate: to, guestCount } = req.body || {};
    villaId = requestedVillaId;
    if (!villaId || !["stay", "event"].includes(bookingType)) {
      return res.status(400).json({ success: false, message: "Villa and a valid booking type are required" });
    }
    const range = parseDateRange(bookingType, from, to);
    if (!range) return res.status(400).json({ success: false, message: "Choose valid future dates" });
    const guests = Number(guestCount);
    const villa = await Villa.findOne({ _id: villaId, isActive: true });
    if (!villa) return res.status(404).json({ success: false, message: "Villa not found" });
    if (!Number.isInteger(guests) || guests < 1 || guests > villa.maxGuests) {
      return res.status(400).json({ success: false, message: `Guest count must be between 1 and ${villa.maxGuests}` });
    }

    lockToken = crypto.randomUUID();
    if (!(await acquireVillaLock(villa._id, lockToken))) {
      return res.status(409).json({ success: false, message: "Villa booking is being processed; please try again" });
    }
    if (!(await slotAvailable(villa._id, range.startDate, range.endDate))) {
      return res.status(409).json({ success: false, message: "Villa is already booked for these dates" });
    }

    const rate = bookingType === "event" ? villa.eventRate : villa.nightlyRate;
    const amount = rate * range.dayCount;
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `v_${villa._id.toString().slice(-8)}_${Date.now()}`.slice(0, 40),
    });
    const booking = await VillaBooking.create({
      villa: villa._id,
      guest: req.user._id,
      bookingType,
      startDate: range.startDate,
      endDate: range.endDate,
      guestCount: guests,
      amount,
      razorpayOrderId: order.id,
      pendingExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
    });

    res.status(200).json({
      success: true,
      bookingId: booking._id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("CREATE VILLA BOOKING ORDER ERROR:", error);
    res.status(500).json({ success: false, message: "Could not start villa booking payment" });
  } finally {
    if (lockToken && villaId) {
      try {
        await releaseVillaLock(villaId, lockToken);
      } catch (error) {
        console.error("RELEASE VILLA BOOKING LOCK ERROR:", error);
      }
    }
  }
};

exports.verifyBookingPayment = async (req, res) => {
  let lockToken;
  let villaId;
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment verification fields" });
    }
    if (!validSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }
    const booking = await VillaBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (String(booking.guest) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "This booking belongs to another account" });
    }
    if (booking.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: "Payment order mismatch" });
    }
    if (booking.status === "confirmed" && booking.razorpayPaymentId === razorpay_payment_id) {
      return res.status(200).json({ success: true, booking });
    }
    if (booking.status !== "pending_payment" || booking.pendingExpiresAt <= new Date()) {
      return res.status(409).json({ success: false, message: "Booking hold expired. Contact support if payment was captured." });
    }

    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (
      payment.order_id !== razorpay_order_id ||
      payment.amount !== Math.round(booking.amount * 100) ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({ success: false, message: "Payment details do not match this booking" });
    }
    if (payment.status !== "captured") {
      return res.status(409).json({ success: false, message: "Payment has not been captured yet" });
    }

    villaId = booking.villa;
    lockToken = crypto.randomUUID();
    if (!(await acquireVillaLock(villaId, lockToken))) {
      return res.status(409).json({ success: false, message: "Villa booking is being processed; please retry verification" });
    }
    if (!(await slotAvailable(villaId, booking.startDate, booking.endDate, booking._id))) {
      return res.status(409).json({ success: false, message: "Villa dates were booked while payment was processing; contact support for a refund" });
    }
    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.paidAt = new Date();
    await booking.save();
    res.status(200).json({ success: true, message: "Villa booking confirmed", booking });
  } catch (error) {
    console.error("VERIFY VILLA PAYMENT ERROR:", error);
    res.status(500).json({ success: false, message: "Villa payment verification failed" });
  } finally {
    if (lockToken && villaId) {
      try {
        await releaseVillaLock(villaId, lockToken);
      } catch (error) {
        console.error("RELEASE VILLA BOOKING LOCK ERROR:", error);
      }
    }
  }
};

exports.getAdminBookings = async (_req, res) => {
  try {
    const bookings = await VillaBooking.find()
      .populate("villa", "name area")
      .populate("guest", "name email phone")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("GET ADMIN VILLA BOOKINGS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to load villa bookings" });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await VillaBooking.find({ guest: req.user._id })
      .populate("villa", "name area address images")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("GET MY VILLA BOOKINGS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to load your villa bookings" });
  }
};

exports.completeBooking = async (req, res) => {
  try {
    const booking = await VillaBooking.findOneAndUpdate(
      { _id: req.params.id, status: "confirmed", endDate: { $lte: new Date() } },
      { status: "completed" },
      { new: true, runValidators: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    res.status(200).json({ success: true, booking });
  } catch (error) {
    console.error("COMPLETE VILLA BOOKING ERROR:", error);
    res.status(500).json({ success: false, message: "Could not update booking" });
  }
};
