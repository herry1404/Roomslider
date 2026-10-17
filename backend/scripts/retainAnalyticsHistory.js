require("dotenv").config();
const mongoose = require("mongoose");
const SiteAnalytics = require("../src/models/siteAnalytics.model");
const CafeMenuAnalytics = require("../src/models/cafeMenuAnalytics.model");

const analyticsModels = [SiteAnalytics, CafeMenuAnalytics];

const retainAnalyticsHistory = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required to remove analytics TTL indexes.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  for (const model of analyticsModels) {
    const collection = model.collection;
    const indexes = await collection.listIndexes().toArray();
    const ttlIndexes = indexes.filter((index) =>
      index.expireAfterSeconds !== undefined
      && Object.keys(index.key || {}).length === 1
      && index.key.createdAt === 1
    );

    for (const index of ttlIndexes) {
      await collection.dropIndex(index.name);
      console.log(`Removed expiry index ${collection.collectionName}.${index.name}; analytics documents were not modified.`);
    }

    if (ttlIndexes.length === 0) {
      console.log(`No analytics expiry index found on ${collection.collectionName}.`);
    }
  }
};

retainAnalyticsHistory()
  .catch((error) => {
    console.error("Could not disable analytics data expiry:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
