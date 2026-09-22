const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleShop', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Scooty', 'Bike', 'Electric', 'Cycle'], required: true },
  fuel: { type: String, required: true },
  kmLimit: { type: String, required: true },
  docRequired: { type: String, required: true },
  pricePerHour: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
  pricePerMonth: { type: Number, required: true },
  deposit: { type: Number, required: true },
  available: { type: Boolean, default: true },
  availabilityNote: { type: String, default: 'Available now' },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
