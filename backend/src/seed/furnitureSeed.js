const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const FurnitureItem = require('../models/furnitureItem.model');

const r10 = (n) => Math.round(n / 10) * 10;

// base = monthly rent for 6 months. 3 months costs more, 12 months costs less.
const plans = (base) => [
  { months: 3, monthlyRent: r10(base * 1.15) },
  { months: 6, monthlyRent: r10(base) },
  { months: 12, monthlyRent: r10(base * 0.9) },
];

// rentBase = null means buy only
const item = (name, category, rentBase, buy, desc, extra = {}) => ({
  name,
  category,
  description: desc,
  rentPlans: rentBase ? plans(rentBase) : [],
  deposit: rentBase ? r10(rentBase * 2) : 0,
  buyPrice: buy,
  secondHandPrice: rentBase && buy ? r10(buy * 0.5) : null,
  deliveryFee: rentBase ? 150 : 0,
  ...extra,
});

const ITEMS = [
  // bedroom
  item('Single Bed', 'bedroom', 400, 7000, 'Sturdy single bed frame, fits standard 3x6 ft mattress.', { badge: 'Popular' }),
  item('Mattress', 'bedroom', 275, 4500, 'Single size foam mattress, comfortable for daily use.'),
  item('Wardrobe / Cupboard', 'bedroom', 500, 9000, 'Two-door wardrobe with shelves and hanging space.'),
  item('Bedsheet, Pillow & Blanket Set', 'bedroom', null, 2200, 'Complete bedding set: 2 bedsheets, 2 pillows, 1 blanket.'),

  // study
  item('Study Table', 'study', 320, 3500, 'Simple study table with sturdy top, good for laptop and books.', { badge: 'Student pick' }),
  item('Study Chair', 'study', 200, 2700, 'Comfortable chair with back support.'),
  item('Ergonomic Study Desk & Chair Set', 'study', 950, 8500, 'Desk with ergonomic chair, ideal for long study or WFH hours.', { badge: 'Student pick' }),
  item('Study Lamp', 'study', null, 800, 'LED study lamp, eye-friendly light.'),

  // kitchen
  item('Fridge (Single Door)', 'kitchen', 750, 14000, 'Single door fridge, around 180 litres.', { badge: 'Popular' }),
  item('Induction Cooktop', 'kitchen', 200, 2000, 'Single burner induction cooktop, easy to use and clean.'),
  item('Microwave Oven', 'kitchen', 350, 7500, 'Solo microwave for reheating and quick cooking.'),
  item('Electric Kettle', 'kitchen', null, 800, '1.5 litre electric kettle for tea, coffee, maggi.'),
  item('Cookware Set', 'kitchen', null, 2200, 'Basic set: kadhai, pan, pressure cooker and utensils.'),
  item('Gas Stove', 'kitchen', null, 2200, 'Two burner gas stove.'),

  // cooling & heating
  item('Air Cooler', 'cooling-heating', 375, 8000, 'Desert cooler, ideal for Indore summers.', { badge: 'Popular' }),
  item('AC (1.5 Ton)', 'cooling-heating', 1850, 36000, '1.5 ton split AC. Installation included on rent.'),
  item('Geyser', 'cooling-heating', 350, 5500, '15 litre storage water heater.'),
  item('Table / Ceiling Fan', 'cooling-heating', 150, 2000, 'Fast, quiet fan.'),

  // laundry & water
  item('Washing Machine (Semi-Auto)', 'laundry-water', 750, 9500, 'Semi-automatic top load, 7 kg.'),
  item('RO Water Purifier', 'laundry-water', 400, 11000, 'RO + UV purifier for safe drinking water. Service included on rent.'),

  // essentials
  item('Iron', 'essentials', null, 1100, 'Dry iron with adjustable temperature.'),
  item('Extension Board', 'essentials', null, 500, '4 socket extension board with switch and surge protection.'),
  item('Wi-Fi Router', 'essentials', null, 1800, 'Dual band Wi-Fi router.'),
  item('Bucket, Mug & Drying Stand Set', 'essentials', null, 750, 'Daily-use bathroom and laundry essentials.'),
];

(async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!uri) {
    console.error('No Mongo URI found in backend/.env (tried MONGO_URI, MONGODB_URI, MONGO_URL)');
    process.exit(1);
  }
  await mongoose.connect(uri);
  let added = 0;
  let skipped = 0;
  for (const it of ITEMS) {
    const exists = await FurnitureItem.findOne({ name: it.name });
    if (exists) {
      skipped++;
      continue;
    }
    await FurnitureItem.create(it);
    added++;
  }
  console.log('Added: ' + added + ', already existed: ' + skipped);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
