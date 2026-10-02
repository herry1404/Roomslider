const mongoose = require('mongoose');
const Vehicle = require('../models/vehicle.model');
const VehicleRequest = require('../models/vehicleRequest.model');

const STATUSES = ['new', 'confirmed', 'picked_up', 'returned', 'cancelled'];
const isAdmin = (req) => req.user?.role === 'admin';

const hasOverlap = async (vehicleId, pickupDate, returnDate, excludeId) => {
  const filter = {
    vehicle: vehicleId,
    status: { $in: ['confirmed', 'picked_up'] },
    pickupDate: { $lt: returnDate },
    returnDate: { $gt: pickupDate },
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return Boolean(await VehicleRequest.exists(filter));
};

const getTotal = (vehicle, durationType, pickupDate, returnDate) => {
  const elapsedDays = Math.ceil((returnDate - pickupDate) / 86400000);
  if (durationType === 'day') return elapsedDays * vehicle.pricePerDay;
  if (durationType === 'week') return Math.ceil(elapsedDays / 7) * vehicle.pricePerWeek;
  return Math.ceil(elapsedDays / 30) * vehicle.pricePerMonth;
};

const cleanLocation = (location) => {
  if (!location) return { lat: null, lng: null };
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { lat: null, lng: null };
  }
  return { lat, lng };
};

exports.createRequest = async (req, res) => {
  try {
    const {
      vehicleId, pickupDate: pickupDateValue, returnDate: returnDateValue,
      durationType, pickupOption, address, location,
    } = req.body;
    if (!mongoose.isValidObjectId(vehicleId)) return res.status(400).json({ message: 'Select a valid vehicle' });
    if (!['day', 'week', 'month'].includes(durationType)) {
      return res.status(400).json({ message: 'Choose a valid rental duration' });
    }
    if (!['self pickup', 'delivery'].includes(pickupOption)) {
      return res.status(400).json({ message: 'Choose self pickup or delivery' });
    }
    if (!address || !String(address.house || '').trim() || !String(address.area || '').trim()) {
      return res.status(400).json({ message: 'House/flat number and area are required' });
    }
    const phone = String(req.user.phone || '').replace(/\D/g, '').slice(-10);
    if (phone.length !== 10) {
      return res.status(400).json({ message: 'Add a valid phone number to your account before requesting a rental' });
    }
    const pickupDate = new Date(pickupDateValue);
    const returnDate = new Date(returnDateValue);
    if (!Number.isFinite(pickupDate.getTime()) || !Number.isFinite(returnDate.getTime()) || returnDate <= pickupDate) {
      return res.status(400).json({ message: 'Choose valid pickup and return dates' });
    }
    if (pickupDate < new Date(Date.now() - 5 * 60 * 1000)) {
      return res.status(400).json({ message: 'Pickup date cannot be in the past' });
    }
    const vehicle = await Vehicle.findOne({ _id: vehicleId, brand: { $exists: true }, isVisible: true });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (!vehicle.isAvailable) return res.status(400).json({ message: 'This vehicle is not currently available' });
    if (await hasOverlap(vehicle._id, pickupDate, returnDate)) {
      return res.status(409).json({ message: 'Vehicle is already requested for these dates' });
    }

    const request = await VehicleRequest.create({
      vehicle: vehicle._id,
      user: req.user._id || req.user.id,
      name: req.user.name || 'Customer',
      phone,
      pickupDate,
      returnDate,
      durationType,
      pickupOption,
      address: {
        house: String(address.house).trim(),
        building: String(address.building || '').trim(),
        area: String(address.area).trim(),
        landmark: String(address.landmark || '').trim(),
      },
      location: cleanLocation(location),
      totalPrice: getTotal(vehicle, durationType, pickupDate, returnDate),
    });
    res.status(201).json(await request.populate('vehicle', 'name brand type'));
  } catch (error) {
    console.error('createVehicleRequest error:', error);
    res.status(500).json({ message: 'Could not save vehicle request' });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await VehicleRequest.find({ user: req.user._id || req.user.id })
      .populate('vehicle', 'name brand type photos')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json(requests);
  } catch (error) {
    console.error('getMyVehicleRequests error:', error);
    res.status(500).json({ message: 'Could not load your vehicle requests' });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const filter = {};
    if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
    const requests = await VehicleRequest.find(filter)
      .populate('vehicle', 'name brand type photos')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json(requests);
  } catch (error) {
    console.error('getAllVehicleRequests error:', error);
    res.status(500).json({ message: 'Could not load vehicle requests' });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Admin only' });
    const { status } = req.body;
    if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid request status' });
    const request = await VehicleRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Vehicle request not found' });
    if (['confirmed', 'picked_up'].includes(status) &&
        await hasOverlap(request.vehicle, request.pickupDate, request.returnDate, request._id)) {
      return res.status(409).json({ message: 'Another confirmed rental overlaps these dates' });
    }
    request.status = status;
    await request.save();
    res.json(request);
  } catch (error) {
    console.error('updateVehicleRequestStatus error:', error);
    res.status(500).json({ message: 'Could not update vehicle request' });
  }
};
