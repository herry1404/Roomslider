const mongoose = require('mongoose');

const serviceProviderSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['cleaning', 'packers', 'furniture', 'wifi', 'appliance-repair'],
    required: true,
  },
  name: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true, default: 'Indore' },
  contactNumber: { type: String, required: true },
  priceNote: { type: String, default: '' },
  description: { type: String, default: '' },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ServiceProvider', serviceProviderSchema);
