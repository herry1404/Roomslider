require('dotenv').config();
const mongoose = require('mongoose');
const ServiceProvider = require('../src/models/service.model');

const providers = [
  {
    name: 'RoomSlider Study Support', category: 'study-support', subType: 'library', area: 'Indore', city: 'Indore',
    contactNumber: '+91-9131181848', description: 'Reading rooms, tutors and printing help for students in Indore.', priceNote: '',
    priceList: [
      { name: 'Library seat (monthly)', type: 'monthly', price: 600, unit: 'per month' },
      { name: 'Library half-day seat', type: 'monthly', price: 400, unit: 'per month' },
      { name: 'Library day pass', type: 'one-time', price: 50, unit: 'per day' },
      { name: 'Home tutor - Class 11-12 (per subject)', type: 'monthly', price: 1500, unit: 'per month' },
      { name: 'Printing B/W', type: 'one-time', price: 2, unit: 'per page' },
      { name: 'Printing colour', type: 'one-time', price: 10, unit: 'per page' },
    ],
  },
  {
    name: 'RoomSlider Rent Agreement Help', category: 'rent-agreement', subType: 'agreement', area: 'Indore', city: 'Indore',
    contactNumber: '+91-9131181848', description: 'Rent agreement drafting and tenant police verification help through our partner advocates in Indore. RoomSlider is only a facilitator.',
    priceNote: 'Price on request', priceList: [],
  },
];

async function seedStudySupport() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  for (const provider of providers) {
    const result = await ServiceProvider.updateOne(
      { name: provider.name, category: provider.category, city: provider.city },
      { $set: provider, $setOnInsert: { isActive: true } },
      { upsert: true },
    );
    console.log(`${provider.name}: ${result.upsertedCount ? 'added' : result.modifiedCount ? 'updated' : 'already current'}`);
  }
  await mongoose.disconnect();
}

seedStudySupport().catch(async (error) => {
  console.error('Study support seed failed:', error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
