const mongoose = require('mongoose');
const Vehicle = require('../models/vehicle.model');
const { createUniqueSlug, ensurePublicSlugs } = require('../utils/publicSlug');

const TYPES = ['Scooty', 'Bike', 'Car', 'SUV', 'Van'];
const FUELS = ['Petrol', 'Diesel', 'Electric'];
const PAGE_SIZE_MAX = 48;

const parseBoolean = (value) => value === true || value === 'true';
const parsePhotos = (value, fallback = []) => {
  if (value === undefined) return fallback;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};
const uploadedPhotos = (files = []) =>
  files.map((file) => file.path || file.secure_url || file.location).filter(Boolean);

const validVehicleData = (body) => {
  const errors = [];
  if (!String(body.name || '').trim()) errors.push('Name is required');
  if (!String(body.brand || '').trim()) errors.push('Brand is required');
  if (!TYPES.includes(body.type)) errors.push('Valid vehicle type is required');
  if (!FUELS.includes(body.fuel)) errors.push('Valid fuel type is required');
  if (!['Manual', 'Automatic'].includes(body.transmission)) errors.push('Valid transmission is required');
  if (!(Number(body.seats) > 0)) errors.push('Seats must be at least 1');
  for (const field of ['pricePerDay', 'pricePerWeek', 'pricePerMonth']) {
    if (!Number.isFinite(Number(body[field])) || Number(body[field]) < 0) errors.push(`${field} must be a valid price`);
  }
  return errors;
};

const buildVehicle = (body, photos) => ({
  name: String(body.name).trim(),
  brand: String(body.brand).trim(),
  type: body.type,
  fuel: body.fuel,
  transmission: body.transmission,
  seats: Number(body.seats),
  photos,
  pricePerDay: Number(body.pricePerDay),
  pricePerWeek: Number(body.pricePerWeek),
  pricePerMonth: Number(body.pricePerMonth),
  pricePerHour: body.pricePerHour === '' || body.pricePerHour == null ? null : Number(body.pricePerHour),
  securityDeposit: Number(body.securityDeposit) || 0,
  freeKmPerDay: Number(body.freeKmPerDay) || 0,
  extraKmCharge: Number(body.extraKmCharge) || 0,
  helmetIncluded: parseBoolean(body.helmetIncluded),
  fuelPolicy: String(body.fuelPolicy || '').trim(),
  documentsRequired: String(body.documentsRequired || '').trim(),
  isAvailable: body.isAvailable === undefined ? true : parseBoolean(body.isAvailable),
  isVisible: body.isVisible === undefined ? true : parseBoolean(body.isVisible),
});

exports.getVehicles = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(PAGE_SIZE_MAX, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
    const filter = { isVisible: true, brand: { $exists: true } };
    if (TYPES.includes(req.query.type)) filter.type = req.query.type;
    if (FUELS.includes(req.query.fuel)) filter.fuel = req.query.fuel;
    if (req.query.available === 'true') filter.isAvailable = true;
    if (req.query.available === 'false') filter.isAvailable = false;
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const escaped = req.query.search.trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { brand: { $regex: escaped, $options: 'i' } },
        { type: { $regex: escaped, $options: 'i' } },
      ];
    }
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .select('name brand slug type fuel transmission seats photos pricePerDay pricePerWeek pricePerMonth pricePerHour securityDeposit isAvailable')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Vehicle.countDocuments(filter),
    ]);
    await ensurePublicSlugs(Vehicle, vehicles, (vehicle) => `${vehicle.brand} ${vehicle.name}`);
    res.json({ vehicles, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('getVehicles error:', error);
    res.status(500).json({ message: 'Could not load vehicles' });
  }
};

exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ brand: { $exists: true } }).sort({ createdAt: -1 }).lean();
    res.json(vehicles);
  } catch (error) {
    console.error('getAllVehicles error:', error);
    res.status(500).json({ message: 'Could not load vehicles' });
  }
};

exports.getVehicleById = async (req, res) => {
  try {
    const identity = mongoose.isValidObjectId(req.params.id)
      ? { _id: req.params.id }
      : { slug: req.params.id.toLowerCase() };
    const vehicle = await Vehicle.findOne({ ...identity, brand: { $exists: true }, isVisible: true }).lean();
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    await ensurePublicSlugs(Vehicle, [vehicle], (item) => `${item.brand} ${item.name}`);
    res.json(vehicle);
  } catch (error) {
    console.error('getVehicleById error:', error);
    res.status(500).json({ message: 'Could not load vehicle' });
  }
};

exports.getAdminVehicleById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Vehicle not found' });
    const vehicle = await Vehicle.findOne({ _id: req.params.id, brand: { $exists: true } }).lean();
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    console.error('getAdminVehicleById error:', error);
    res.status(500).json({ message: 'Could not load vehicle' });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const errors = validVehicleData(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join('. ') });
    const vehicleData = buildVehicle(req.body, uploadedPhotos(req.files));
    vehicleData.slug = await createUniqueSlug(Vehicle, `${vehicleData.brand} ${vehicleData.name}`);
    const vehicle = await Vehicle.create(vehicleData);
    res.status(201).json(vehicle);
  } catch (error) {
    console.error('createVehicle error:', error);
    res.status(500).json({ message: 'Could not add vehicle' });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Vehicle not found' });
    const vehicle = await Vehicle.findOne({ _id: req.params.id, brand: { $exists: true } });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    const data = { ...vehicle.toObject(), ...req.body };
    const errors = validVehicleData(data);
    if (errors.length) return res.status(400).json({ message: errors.join('. ') });

    const existingPhotos = parsePhotos(req.body.existingPhotos, vehicle.photos);
    const photoSet = new Set([...existingPhotos, ...uploadedPhotos(req.files)]);
    const vehicleData = buildVehicle(data, [...photoSet]);
    if (data.name !== vehicle.name || data.brand !== vehicle.brand) {
      vehicleData.slug = await createUniqueSlug(Vehicle, `${vehicleData.brand} ${vehicleData.name}`, vehicle._id);
    }
    Object.assign(vehicle, vehicleData);
    await vehicle.save();
    res.json(vehicle);
  } catch (error) {
    console.error('updateVehicle error:', error);
    res.status(500).json({ message: 'Could not update vehicle' });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Vehicle not found' });
    const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, brand: { $exists: true } });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted' });
  } catch (error) {
    console.error('deleteVehicle error:', error);
    res.status(500).json({ message: 'Could not delete vehicle' });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Vehicle not found' });
    if (typeof req.body.isAvailable !== 'boolean') {
      return res.status(400).json({ message: 'isAvailable must be a boolean' });
    }
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, brand: { $exists: true } },
      { $set: { isAvailable: req.body.isAvailable } },
      { new: true, runValidators: true }
    );
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    console.error('updateAvailability error:', error);
    res.status(500).json({ message: 'Could not update availability' });
  }
};
