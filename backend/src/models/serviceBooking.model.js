const mongoose = require('mongoose');

const serviceBookingSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true },
  category: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: '' },
  phone: { type: String, required: true },
  selectedItems: [{
    name: String,
    type: { type: String, enum: ['monthly', 'one-time'] },
    price: Number,
    unit: String,
    perUnit: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    lineTotal: { type: Number, default: 0 },
  }],
  totalEstimate: { type: Number, default: 0 },
  startDate: { type: Date, default: null },
  preferredDate: { type: Date, default: null },
  preferredTimeSlot: { type: String, enum: ['morning', 'afternoon', 'evening', ''], default: '' },
  address: {
    flatNo: { type: String, default: '' }, building: { type: String, default: '' },
    area: { type: String, default: '' }, landmark: { type: String, default: '' },
    lat: { type: Number, default: null }, lng: { type: Number, default: null },
  },
  note: { type: String, default: '' },
  extra: { type: mongoose.Schema.Types.Mixed, default: {} },
  idPhotoUrl: { type: String, default: '', select: false },
  idPhotoPublicId: { type: String, default: '', select: false },
  status: {
    type: String,
    enum: ['new', 'contacted', 'confirmed', 'completed', 'cancelled'],
    default: 'new',
  },
  adminNote: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ServiceBooking', serviceBookingSchema);
