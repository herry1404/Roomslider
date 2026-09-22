const VehicleShop = require('../models/vehicleShop.model');

// Create a new vehicle shop
exports.createShop = async (req, res) => {
  try {
    const { shopName, address, city, contactNumber } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one shop image is required' });
    }

    const images = req.files.map((file) => file.path);

    const shop = await VehicleShop.create({
      owner: req.user._id,
      shopName,
      address,
      city,
      contactNumber,
      images,
    });
    res.status(201).json(shop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get shop(s) owned by logged-in user
exports.getMyShops = async (req, res) => {
  try {
    const shops = await VehicleShop.find({ owner: req.user._id });
    res.json(shops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all active shops (public listing)
exports.getAllShops = async (req, res) => {
  try {
    const shops = await VehicleShop.find({ isActive: true });
    res.json(shops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
