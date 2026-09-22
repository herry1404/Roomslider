const Vehicle = require('../models/vehicle.model');
const VehicleShop = require('../models/vehicleShop.model');

// Create a new vehicle under a shop
exports.createVehicle = async (req, res) => {
  try {
    const { shop, name, type, fuel, kmLimit, docRequired, pricePerHour, pricePerDay, pricePerMonth, deposit } = req.body;

    const shopDoc = await VehicleShop.findById(shop);
    if (!shopDoc) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    if (req.user.role !== 'admin' && String(shopDoc.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized for this shop' });
    }

    const vehicle = await Vehicle.create({
      shop, name, type, fuel, kmLimit, docRequired,
      pricePerHour, pricePerDay, pricePerMonth, deposit,
    });
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all vehicles for a specific shop (public)
exports.getVehiclesByShop = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ shop: req.params.shopId, available: true });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single vehicle (public)
exports.getSingleVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('shop');
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('shop');
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    if (req.user.role !== 'admin' && String(vehicle.shop.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    Object.assign(vehicle, req.body);
    await vehicle.save();
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('shop');
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    if (req.user.role !== 'admin' && String(vehicle.shop.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await vehicle.deleteOne();
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
