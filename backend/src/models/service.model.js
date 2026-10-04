const mongoose = require('mongoose');

const priceListItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['monthly', 'one-time'], required: true },
  price: { type: Number, required: true },
  unit: { type: String, default: '' },
  note: { type: String, default: '' },
  perUnit: { type: String, enum: ['', 'month', 'day', 'hour', 'visit', 'washroom', 'room', 'person', 'machine', 'page'], default: '' },
  allowQuantity: { type: Boolean, default: false },
}, { _id: false });

const serviceProviderSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['cleaning', 'packers', 'furniture', 'wifi', 'appliance-repair', 'study-support', 'rent-agreement'],
    required: true,
  },
  name: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true, default: 'Indore' },
  contactNumber: { type: String, required: true },
  priceNote: { type: String, default: '' },
  price: { type: mongoose.Schema.Types.Mixed, default: null },
  subType: { type: String, default: '' },
  priceList: { type: [priceListItemSchema], default: [] },
  experienceYears: { type: Number, default: null },
  languages: { type: [String], default: [] },
  availability: { type: String, default: '' },
  serviceAreas: { type: [String], default: [] },
  isVerified: { type: Boolean, default: false },
  description: { type: String, default: '' },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ServiceProvider', serviceProviderSchema);
