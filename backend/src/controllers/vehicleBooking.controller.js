const VehicleBooking = require('../models/vehicleBooking.model');
const Vehicle = require('../models/vehicle.model');

const estimateAmount = (vehicle, start, end) => {
  const hours = Math.ceil((end - start) / (1000 * 60 * 60));
  if (hours < 24) return Math.min(hours * vehicle.pricePerHour, vehicle.pricePerDay);
  const days = Math.ceil(hours / 24);
  if (days >= 30) {
    const months = Math.floor(days / 30);
    const restDays = days - months * 30;
    return months * vehicle.pricePerMonth + restDays * vehicle.pricePerDay;
  }
  return days * vehicle.pricePerDay;
};

const hasOverlap = async (vehicleId, start, end, excludeId = null) => {
  const query = {
    vehicle: vehicleId,
    status: 'confirmed',
    startDate: { $lt: end },
    endDate: { $gt: start },
  };
  if (excludeId) query._id = { $ne: excludeId };
  const found = await VehicleBooking.findOne(query).select('_id').lean();
  return !!found;
};

exports.createBooking = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate, phone, note } = req.body;

    if (!vehicleId || !startDate || !endDate || !phone) {
      return res.status(400).json({ message: 'Vehicle, dates and phone are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || end <= start) {
      return res.status(400).json({ message: 'Invalid dates' });
    }
    if (start < new Date(Date.now() - 5 * 60 * 1000)) {
      return res.status(400).json({ message: 'Start time cannot be in the past' });
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ message: 'Enter a valid 10 digit phone number' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (!vehicle.available) {
      return res.status(400).json({ message: 'This vehicle is not available right now' });
    }

    if (await hasOverlap(vehicle._id, start, end)) {
      return res.status(409).json({ message: 'Vehicle is already booked for these dates' });
    }

    const booking = await VehicleBooking.create({
      vehicle: vehicle._id,
      shop: vehicle.shop,
      user: req.user._id || req.user.id,
      phone: cleanPhone,
      startDate: start,
      endDate: end,
      note: String(note || '').slice(0, 300),
      estimatedAmount: estimateAmount(vehicle, start, end),
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('createBooking error:', error);
    res.status(500).json({ message: 'Could not create request' });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await VehicleBooking.find({ user: req.user._id || req.user.id })
      .populate('vehicle', 'name type')
      .populate('shop', 'shopName')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(bookings);
  } catch (error) {
    console.error('getMyBookings error:', error);
    res.status(500).json({ message: 'Could not load requests' });
  }
};

exports.getBookedSlots = async (req, res) => {
  try {
    const slots = await VehicleBooking.find({
      vehicle: req.params.vehicleId,
      status: 'confirmed',
      endDate: { $gt: new Date() },
    })
      .select('startDate endDate -_id')
      .sort({ startDate: 1 })
      .lean();
    res.json(slots);
  } catch (error) {
    console.error('getBookedSlots error:', error);
    res.status(500).json({ message: 'Could not load availability' });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const bookings = await VehicleBooking.find(filter)
      .populate('vehicle', 'name type pricePerDay')
      .populate('shop', 'shopName contactNumber')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json(bookings);
  } catch (error) {
    console.error('getAllBookings error:', error);
    res.status(500).json({ message: 'Could not load bookings' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const allowed = ['confirmed', 'rejected', 'cancelled', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await VehicleBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (status === 'confirmed') {
      if (await hasOverlap(booking.vehicle, booking.startDate, booking.endDate, booking._id)) {
        return res.status(409).json({ message: 'Another confirmed booking overlaps these dates' });
      }
    }

    booking.status = status;
    if (adminNote !== undefined) booking.adminNote = String(adminNote).slice(0, 300);
    await booking.save();

    res.json(booking);
  } catch (error) {
    console.error('updateBookingStatus error:', error);
    res.status(500).json({ message: 'Could not update booking' });
  }
};
