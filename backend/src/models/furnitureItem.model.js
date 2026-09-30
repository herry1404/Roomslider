const mongoose = require('mongoose');

const CATEGORIES = [
  'bedroom',
  'study',
  'kitchen',
  'cooling-heating',
  'laundry-water',
  'essentials',
];

const rentPlanSchema = new mongoose.Schema(
  {
    months: { type: Number, required: true },
    monthlyRent: { type: Number, required: true },
  },
  { _id: false }
);

const furnitureItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    description: { type: String, default: '' },
    images: [{ type: String }],

    // Rent: empty array = rent not offered for this item
    rentPlans: { type: [rentPlanSchema], default: [] },
    deposit: { type: Number, default: 0 },

    // Buy: null = buy not offered for this item
    buyPrice: { type: Number, default: null },
    secondHandPrice: { type: Number, default: null },

    deliveryFee: { type: Number, default: 0 },

    isAvailable: { type: Boolean, default: true }, // false = Out of stock
    isActive: { type: Boolean, default: true }, // false = hidden from public
    badge: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FurnitureItem', furnitureItemSchema);
module.exports.CATEGORIES = CATEGORIES;
