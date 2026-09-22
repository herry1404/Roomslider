const mongoose = require('mongoose');

const vehicleBookingSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleShop', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phone: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  note: { type: String, default: '' },
  estimatedAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
    default: 'pending',
  },
  adminNote: { type: String, default: '' },
}, { timestamps: true });

vehicleBookingSchema.index({ vehicle: 1, status: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('VehicleBooking', vehicleBookingSchema);
