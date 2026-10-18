require("dotenv").config();
const mongoose = require("mongoose");

async function migrate() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(process.env.MONGODB_URI);
  const spins = mongoose.connection.collection("spins");
  await spins.updateMany({ type: { $exists: false } }, { $set: { type: "cafe" } });
  const indexes = await spins.indexes();
  const legacy = indexes.find((index) => index.unique
    && JSON.stringify(index.key) === JSON.stringify({ userId: 1, cafeId: 1, dateKey: 1 }));
  if (legacy) await spins.dropIndex(legacy.name);
  await spins.createIndex({ userId: 1, cafeId: 1, type: 1, dateKey: 1 }, {
    unique: true,
    name: "userId_1_cafeId_1_type_1_dateKey_1",
  });
  console.log("Migrated Spin uniqueness to user + cafe + type + Asia/Kolkata date.");
}

migrate()
  .catch((error) => { console.error("Spin index migration failed:", error.message); process.exitCode = 1; })
  .finally(async () => mongoose.disconnect());
