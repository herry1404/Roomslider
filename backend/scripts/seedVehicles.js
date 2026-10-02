require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('../src/models/vehicle.model');

const vehicles = [
  ['Honda', 'Activa 6G', 'Scooty', 450],
  ['TVS', 'Jupiter', 'Scooty', 450],
  ['Suzuki', 'Access 125', 'Scooty', 500],
  ['TVS', 'Ntorq 125', 'Scooty', 700],
  ['Hero', 'Splendor', 'Bike', 450],
  ['Bajaj', 'Pulsar 150', 'Bike', 700],
  ['Yamaha', 'FZ', 'Bike', 800],
  ['TVS', 'Apache 160', 'Bike', 800],
  ['Royal Enfield', 'Classic 350', 'Bike', 1150],
  ['Royal Enfield', 'Hunter 350', 'Bike', 1000],
  ['Maruti', 'Swift', 'Car', 1650],
  ['Maruti', 'Swift Dzire', 'Car', 1563],
  ['Hyundai', 'i20', 'Car', 2000],
  ['Maruti', 'Brezza', 'Car', 1771],
  ['Maruti', 'Ertiga', 'Car', 2500],
  ['Toyota', 'Innova Crysta', 'Car', 4000],
  ['Mahindra', 'Thar', 'Car', 4000],
].map(([brand, name, type, pricePerDay]) => {
  const twoWheeler = ['Scooty', 'Bike'].includes(type);
  const automatic = type === 'Scooty';
  return {
    name,
    brand,
    type,
    fuel: brand === 'Toyota' ? 'Diesel' : 'Petrol',
    transmission: automatic ? 'Automatic' : 'Manual',
    seats: twoWheeler ? 2 : ['Ertiga', 'Innova Crysta'].includes(name) ? 7 : name === 'Thar' ? 4 : 5,
    photos: [],
    pricePerDay,
    pricePerWeek: pricePerDay * 6,
    pricePerMonth: pricePerDay * 20,
    pricePerHour: null,
    securityDeposit: twoWheeler ? 2000 : 5000,
    freeKmPerDay: twoWheeler ? 130 : 125,
    extraKmCharge: twoWheeler ? 3.5 : 9,
    helmetIncluded: twoWheeler,
    fuelPolicy: '',
    documentsRequired: '',
    isAvailable: true,
    isVisible: true,
  };
});

async function seedVehicles() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  const operations = vehicles.map((vehicle) => ({
    updateOne: {
      filter: { brand: vehicle.brand, name: vehicle.name },
      update: { $setOnInsert: vehicle },
      upsert: true,
    },
  }));
  const result = await Vehicle.bulkWrite(operations);
  console.log(`Vehicle seed complete: ${result.upsertedCount} added, ${result.matchedCount} already present.`);
  await mongoose.disconnect();
}

seedVehicles().catch(async (error) => {
  console.error('Vehicle seed failed:', error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
