require('dotenv').config();
const mongoose = require('mongoose');
const ServiceProvider = require('../src/models/service.model');

async function cleanupCleaningSeed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await ServiceProvider.deleteMany({
    name: 'RoomSlider Cleaning Team',
    category: 'cleaning',
  });
  console.log(`Cleaning seed cleanup complete: ${result.deletedCount} provider(s) removed.`);
  await mongoose.disconnect();
}

cleanupCleaningSeed().catch(async (error) => {
  console.error('Cleaning seed cleanup failed:', error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
