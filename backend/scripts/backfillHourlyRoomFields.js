require("dotenv").config();
const mongoose = require("mongoose");
const Room = require("../src/models/room.model");

async function backfillHourlyRoomFields() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  await mongoose.connect(process.env.MONGODB_URI);
  const hourlyEnabledResult = await Room.updateMany(
    { hourlyEnabled: { $exists: false } },
    { $set: { hourlyEnabled: false, hourlySlabs: [], checkIn24x7: false } }
  );
  const hourlyOnlyResult = await Room.updateMany(
    { hourlyOnly: { $exists: false } },
    { $set: { hourlyOnly: false } }
  );
  console.log(
    `Hourly room backfill complete: ${hourlyEnabledResult.modifiedCount} hourlyEnabled field(s), `
    + `${hourlyOnlyResult.modifiedCount} hourlyOnly field(s) updated.`
  );
  await mongoose.disconnect();
}

backfillHourlyRoomFields().catch(async (error) => {
  console.error("Hourly room backfill failed:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
