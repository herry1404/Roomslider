const mongoose = require('mongoose');

const vehicleRequestSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    pickupDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    durationType: { type: String, enum: ['day', 'week', 'month'], required: true },
    pickupOption: { type: String, enum: ['self pickup', 'delivery'], required: true },
    address: {
      house: { type: String, required: true, trim: true },
      building: { type: String, default: '', trim: true },
      area: { type: String, required: true, trim: true },
      landmark: { type: String, default: '', trim: true },
      city: { type: String, default: 'Indore', trim: true },
      state: { type: String, default: 'Madhya Pradesh', trim: true },
      postalCode: { type: String, default: '', trim: true, maxlength: 6 },
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['new', 'confirmed', 'picked_up', 'returned', 'cancelled'],
      default: 'new',
      index: true,
    },
  },
  { timestamps: true }
);

vehicleRequestSchema.index({ vehicle: 1, status: 1, pickupDate: 1, returnDate: 1 });

module.exports = mongoose.model('VehicleRequest', vehicleRequestSchema);
