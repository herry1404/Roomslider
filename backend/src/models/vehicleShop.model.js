const mongoose = require('mongoose');

const vehicleShopSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true, default: 'Indore' },
  contactNumber: { type: String, required: true },
  images: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('VehicleShop', vehicleShopSchema);
