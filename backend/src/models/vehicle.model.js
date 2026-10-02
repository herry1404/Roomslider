const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Scooty', 'Bike', 'Car', 'SUV', 'Van'], required: true },
    fuel: { type: String, enum: ['Petrol', 'Diesel', 'Electric'], required: true },
    transmission: { type: String, enum: ['Manual', 'Automatic'], required: true },
    seats: { type: Number, min: 1, required: true },
    photos: [{ type: String }],
    pricePerDay: { type: Number, min: 0, required: true },
    pricePerWeek: { type: Number, min: 0, required: true },
    pricePerMonth: { type: Number, min: 0, required: true },
    pricePerHour: { type: Number, min: 0, default: null },
    securityDeposit: { type: Number, min: 0, default: 0 },
    freeKmPerDay: { type: Number, min: 0, default: 0 },
    extraKmCharge: { type: Number, min: 0, default: 0 },
    helmetIncluded: { type: Boolean, default: false },
    fuelPolicy: { type: String, default: '' },
    documentsRequired: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

vehicleSchema.index({ isVisible: 1, isAvailable: 1, type: 1, createdAt: -1 });
vehicleSchema.index({ name: 'text', brand: 'text' });

module.exports = mongoose.model('Vehicle', vehicleSchema);
