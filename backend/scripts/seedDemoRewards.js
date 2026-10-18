require("dotenv").config();
const mongoose = require("mongoose");
const Cafe = require("../src/models/Cafe");
const Sponsor = require("../src/models/Sponsor");
const Coupon = require("../src/models/Coupon");

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

  const sponsors = await Promise.all([
    { name: "DemoGym", videoUrl: "", durationSec: 10, active: true },
    { name: "DemoBites", videoUrl: "", durationSec: 10, active: true },
  ].map((sponsor) => Sponsor.findOneAndUpdate(
    { name: sponsor.name }, { $set: sponsor }, { upsert: true, returnDocument: "after", runValidators: true }
  )));
  const onlineCoupons = [
    ["DemoMart", "10% off demo essentials", "DEMO10"],
    ["DemoBooks", "₹75 off a demo order", "BOOK75"],
    ["DemoStyle", "15% off demo picks", "STYLE15"],
    ["DemoTech", "₹100 off demo accessories", "TECH100"],
    ["DemoStay", "12% off a demo booking", "STAY12"],
  ];
  await Promise.all(onlineCoupons.map(([brand, title, code], index) => Coupon.findOneAndUpdate(
    { code },
    { $set: { kind: "online", sponsorId: null, brand, title, code, terms: "Demo coupon for the RoomSlider rewards preview.", stock: 100, weight: 5 - Math.min(index, 4), active: true } },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
  )));
  await Promise.all(sponsors.map((sponsor, index) => Coupon.findOneAndUpdate(
    { code: `LOCAL${index + 1}0` },
    { $set: { kind: "local", sponsorId: sponsor._id, brand: sponsor.name, title: `${sponsor.name} demo reward`, code: `LOCAL${index + 1}0`, terms: "Demo sponsor coupon for the RoomSlider rewards preview.", stock: 100, weight: 1, active: true } },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
  )));
  console.log("Seeded RoomSlider demo rewards, 2 demo sponsors, and 5 online demo coupons.");
}

seed()
  .catch((error) => {
    console.error("Demo rewards seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
