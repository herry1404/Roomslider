require("dotenv").config();
const mongoose = require("mongoose");
const Cafe = require("../src/models/Cafe");

const rewards = [
  { label: "₹10 off your order", valueRs: 10, weight: 30, minStreak: 0 },
  { label: "₹15 off your order", valueRs: 15, weight: 25, minStreak: 0 },
  { label: "Free chai", valueRs: 20, weight: 20, minStreak: 2 },
  { label: "₹25 cafe credit", valueRs: 25, weight: 12, minStreak: 2 },
  { label: "Free snack", valueRs: 30, weight: 8, minStreak: 4 },
  { label: "₹50 cafe credit", valueRs: 50, weight: 5, minStreak: 7 },
];

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(process.env.MONGODB_URI);
  const update = {
    $set: { name: "RoomSlider", isDemo: true, rewards },
    $setOnInsert: { slug: "roomslider-demo", dailyBudgetRs: 100, budgetDate: "", spentTodayRs: 0 },
  };
  if (process.env.REWARDS_DEMO_OWNER_ID) {
    update.$set.ownerId = process.env.REWARDS_DEMO_OWNER_ID;
  }
  await Cafe.findOneAndUpdate(
    { slug: "roomslider-demo" },
    update,
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
  );
  console.log("Seeded RoomSlider demo rewards with a ₹100 daily budget.");
}

seed()
  .catch((error) => {
    console.error("Demo rewards seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
