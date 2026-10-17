require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const LoyaltyCafe = require("../src/models/LoyaltyCafe");
const { DEFAULT_PRIZES } = require("../src/services/loyalty.service");

async function seedLoyaltyDemo() {
  const pin = process.env.LOYALTY_DEMO_PIN;
  if (!pin || pin.length < 6 || pin.length > 64) {
    throw new Error("Set LOYALTY_DEMO_PIN to a 6-64 character staff PIN before running this seed.");
  }
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  await mongoose.connect(process.env.MONGODB_URI);
  const staffPinHash = await bcrypt.hash(pin, 12);
  const cafe = {
    slug: "roomslider-demo",
    name: "RoomSlider",
    isDemo: true,
    active: true,
    stampsRequired: 5,
    dailyStampLimit: 3,
    rewardExpiryDays: 7,
    stampRewardLabel: "Free Chai",
    staffPinHash,
    dailyRewardBudget: 10,
    prizes: DEFAULT_PRIZES,
  };
  const result = await LoyaltyCafe.updateOne(
    { slug: cafe.slug },
    { $set: cafe },
    { upsert: true },
  );
  console.log(`RoomSlider trial cafe: ${result.upsertedCount ? "created" : "updated"}.`);
  await mongoose.disconnect();
}

seedLoyaltyDemo().catch(async (error) => {
  console.error("Loyalty demo seed failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
