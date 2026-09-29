const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'FurnitureItem' },
    name: String,
    mode: { type: String, enum: ['rent', 'buy'] },
    months: { type: Number, default: 0 },
    cond: { type: String, default: 'new' },
    unit: Number,
    deposit: { type: Number, default: 0 },
    delivery: { type: Number, default: 0 },
    qty: Number,
  },
  { _id: false }
);

const furnitureRequestSchema = new mongoose.Schema(
  {
    requestCode: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    items: [lineSchema],
    totals: {
      rentMonthly: { type: Number, default: 0 },
      deposit: { type: Number, default: 0 },
      buyTotal: { type: Number, default: 0 },
      delivery: { type: Number, default: 0 },
      initial: { type: Number, default: 0 },
    },
    address: {
      house: { type: String, required: true },
      building: { type: String, default: '' },
      area: { type: String, required: true },
      landmark: { type: String, default: '' },
      city: { type: String, default: 'Indore' },
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    mapsLink: { type: String, default: '' },
    deliveryDate: { type: String, default: '' },
    status: {
      type: String,
      enum: ['new', 'confirmed', 'delivered', 'cancelled'],
      default: 'new',
    },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FurnitureRequest', furnitureRequestSchema);
