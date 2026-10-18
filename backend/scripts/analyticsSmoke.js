const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const Ad = require("../src/models/ad.model");
const AnalyticsEvent = require("../src/models/analyticsEvent.model");

const apiBase = (process.argv[2] || "http://localhost:5000/api/track").replace(/\/+$/, "");
const types = [
  "listing_view",
  "call_click",
  "whatsapp_click",
  "contact_request",
  "wishlist_add",
  "share",
  "owner_profile_view",
  "search",
  "ad_impression",
  "ad_click",
];

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  await mongoose.connect(process.env.MONGODB_URI);
  const smokeId = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const visitorIds = types.map((_, index) => `${smokeId}-${index}`);
  let ad;
  try {
    ad = await Ad.create({
      slot: "top",
      targetBy: "all",
      text: "Analytics smoke test",
      logoUrl: "https://example.com/smoke.png",
      linkUrl: "https://example.com/",
      active: false,
    });
    await Promise.all(types.map((type, index) => fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        listingType: "other",
        visitorId: visitorIds[index],
        ...(type === "ad_impression" || type === "ad_click" ? { adId: String(ad._id) } : {}),
        source: type.startsWith("ad_") ? "ad" : "listing",
        meta: { smokeId },
      }),
    }).then((response) => {
      if (response.status !== 204) throw new Error(`Event ${type} returned HTTP ${response.status}`);
    })));

    await new Promise((resolve) => setTimeout(resolve, 1200));
    const rows = await AnalyticsEvent.aggregate([
      { $match: { visitorId: { $in: visitorIds }, "meta.smokeId": smokeId } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const counts = Object.fromEntries(rows.map(({ _id, count }) => [_id, count]));
    for (const type of types) counts[type] = counts[type] || 0;
    console.log(JSON.stringify(counts, null, 2));
    if (types.some((type) => counts[type] !== 1)) process.exitCode = 1;
  } finally {
    await AnalyticsEvent.deleteMany({ "meta.smokeId": smokeId });
    if (ad) await Ad.deleteOne({ _id: ad._id });
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Analytics smoke test failed:", error.message);
  process.exitCode = 1;
});
