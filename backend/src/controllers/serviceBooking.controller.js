const ServiceBooking = require('../models/serviceBooking.model');
const ServiceProvider = require('../models/service.model');

exports.createBooking = async (req, res) => {
  try {
    const { providerId, preferredDate, address, phone, note } = req.body;

    if (!providerId || !preferredDate || !address || !phone) {
      return res.status(400).json({ message: 'Provider, date, address and phone are required' });
    }

    const date = new Date(preferredDate);
    if (isNaN(date)) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ message: 'Enter a valid 10 digit phone number' });
    }

    const provider = await ServiceProvider.findById(providerId);
    if (!provider || !provider.isActive) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const booking = await ServiceBooking.create({
      provider: provider._id,
      category: provider.category,
      user: req.user._id || req.user.id,
      phone: cleanPhone,
      preferredDate: date,
      address: String(address).slice(0, 300),
      note: String(note || '').slice(0, 300),
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('createBooking error:', error);
    res.status(500).json({ message: 'Could not create request' });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await ServiceBooking.find({ user: req.user._id || req.user.id })
      .populate('provider', 'name category')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(bookings);
  } catch (error) {
    console.error('getMyBookings error:', error);
    res.status(500).json({ message: 'Could not load requests' });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    const bookings = await ServiceBooking.find(filter)
      .populate('provider', 'name contactNumber category')
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

    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = status;
    if (adminNote !== undefined) booking.adminNote = String(adminNote).slice(0, 300);
    await booking.save();

    res.json(booking);
  } catch (error) {
    console.error('updateBookingStatus error:', error);
    res.status(500).json({ message: 'Could not update booking' });
  }
};
