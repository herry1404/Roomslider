require("dotenv").config();
const mongoose = require("mongoose");
const Room = require("./src/models/room.model");
const Property = require("./src/models/property.model");

const APPLY = process.argv.includes("--apply");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const rooms = await Room.find({ property: null }, "title location owner category").lean();
  console.log(APPLY ? "MODE: APPLY (database me likhega)" : "MODE: DRY-RUN (kuch likhega nahi)");
  console.log("Rooms without property:", rooms.length);

  for (const r of rooms) {
    const data = {
      name: (r.title || "").trim(),
      area: (r.location || "").trim(),
      owner: r.owner || null,
      propertyType: r.category || "Room",
    };
    console.log("-", data.propertyType, "|", data.name, "|", data.area);
    if (APPLY) {
      const prop = await Property.create(data);
      await Room.updateOne({ _id: r._id }, { $set: { property: prop._id } });
    }
  }

  if (APPLY) {
    console.log("Properties now:", await Property.countDocuments());
    console.log("Rooms still without property:", await Room.countDocuments({ property: null }));
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
