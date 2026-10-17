const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { once } = require("node:events");
const Ad = require("../src/models/ad.model");
const CafeMenuAnalytics = require("../src/models/cafeMenuAnalytics.model");
const adRoutes = require("../src/routes/ad.routes");
const {
  trackCafeMenuEvent,
  getCafeMenuAnalytics,
} = require("../src/controllers/cafeMenuAnalytics.controller");

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("cafe menu tracking rejects invalid slugs before writing events", async () => {
  const res = response();
  await trackCafeMenuEvent({
    body: {
      type: "menu_view",
      cafe: "Wow Pav",
      location: "bhawarkua",
      visitorId: "visitor-session-123456789",
    },
  }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("ad event tracking requires a valid ad id", async () => {
  const res = response();
  await trackCafeMenuEvent({
    body: {
      type: "ad_click",
      cafe: "wowpav",
      location: "bhawarkua",
      visitorId: "visitor-session-123456789",
    },
  }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("analytics route accepts form-encoded ad click beacons", async () => {
  const originalCreate = CafeMenuAnalytics.create;
  const originalExists = Ad.exists;
  let savedEvent;
  CafeMenuAnalytics.create = async (event) => { savedEvent = event; };
  Ad.exists = async () => true;

  const app = express();
  app.use(express.json());
  app.use("/api/ads", adRoutes);
  const server = app.listen(0);

  try {
    await once(server, "listening");
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/ads/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        type: "ad_click",
        cafe: "wowpav",
        location: "bhawarkua",
        visitorId: "visitor-session-123456789",
        source: "Direct",
        platform: "Android",
        adId: "507f1f77bcf86cd799439011",
      }),
    });
    assert.equal(response.status, 202);
    assert.equal(savedEvent.type, "ad_click");
    assert.equal(savedEvent.adId, "507f1f77bcf86cd799439011");
  } finally {
    server.close();
    CafeMenuAnalytics.create = originalCreate;
    Ad.exists = originalExists;
  }
});

test("cafe ad analytics returns empty report data for a valid period", async () => {
  const originalAggregate = CafeMenuAnalytics.aggregate;
  const originalAnalyticsFind = CafeMenuAnalytics.find;
  const originalFind = Ad.find;
  CafeMenuAnalytics.aggregate = async () => [];
  CafeMenuAnalytics.find = () => ({
    sort: () => ({
      select: () => ({
        limit: () => ({ lean: async () => [] }),
      }),
    }),
  });
  Ad.find = () => ({ select: () => ({ lean: async () => [] }) });
  try {
    const res = response();
    await getCafeMenuAnalytics({ query: { days: "30" } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.analytics.summary, {
      menuViews: 0,
      uniqueVisitors: 0,
      adImpressions: 0,
      adClicks: 0,
      clickRate: 0,
    });
    assert.deepEqual(res.body.analytics.today, {
      menuViews: 0,
      uniqueVisitors: 0,
      adImpressions: 0,
      adClicks: 0,
      clickRate: 0,
    });
    assert.equal(res.body.analytics.dailyViews.length, 30);
    assert.ok(res.body.analytics.dailyViews.every((row) =>
      row.views === 0 && row.adImpressions === 0 && row.adClicks === 0 && row.uniqueVisitors === 0
    ));
    assert.deepEqual(res.body.analytics.byCafe, []);
    assert.deepEqual(res.body.analytics.byLocation, []);
    assert.deepEqual(res.body.analytics.recentEvents, []);
    assert.deepEqual(res.body.analytics.adPerformance, []);
  } finally {
    CafeMenuAnalytics.aggregate = originalAggregate;
    CafeMenuAnalytics.find = originalAnalyticsFind;
    Ad.find = originalFind;
  }
});

test("cafe menu analytics includes recent menu and ad events", async () => {
  const originalAggregate = CafeMenuAnalytics.aggregate;
  const originalAnalyticsFind = CafeMenuAnalytics.find;
  const originalFind = Ad.find;
  const adId = "507f1f77bcf86cd799439011";
  const createdAt = new Date("2026-10-17T05:00:00.000Z");
  CafeMenuAnalytics.aggregate = async () => [];
  CafeMenuAnalytics.find = () => ({
    sort: () => ({
      select: () => ({
        limit: () => ({
          lean: async () => [
            { type: "ad_click", cafe: "wowpav", location: "bhawarkua", adId, createdAt },
            { type: "menu_view", cafe: "wowpav", location: "bhawarkua", createdAt },
          ],
        }),
      }),
    }),
  });
  Ad.find = () => ({
    select: () => ({
      lean: async () => [{ _id: { toString: () => adId }, text: "Cafe offer" }],
    }),
  });

  try {
    const res = response();
    await getCafeMenuAnalytics({ query: { days: "7" } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.analytics.recentEvents, [
      { type: "ad_click", cafe: "wowpav", location: "bhawarkua", ad: "Cafe offer", createdAt },
      { type: "menu_view", cafe: "wowpav", location: "bhawarkua", ad: "", createdAt },
    ]);
  } finally {
    CafeMenuAnalytics.aggregate = originalAggregate;
    CafeMenuAnalytics.find = originalAnalyticsFind;
    Ad.find = originalFind;
  }
});

test("cafe ad analytics only accepts supported reporting periods", async () => {
  const res = response();
  await getCafeMenuAnalytics({ query: { days: "14" } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("cafe ad analytics includes all retained history", async () => {
  const originalAggregate = CafeMenuAnalytics.aggregate;
  const originalAnalyticsFind = CafeMenuAnalytics.find;
  const originalFind = Ad.find;
  CafeMenuAnalytics.aggregate = async () => [];
  CafeMenuAnalytics.find = () => ({
    sort: () => ({
      select: () => ({
        limit: () => ({ lean: async () => [] }),
      }),
    }),
  });
  Ad.find = () => ({ select: () => ({ lean: async () => [] }) });

  try {
    const res = response();
    await getCafeMenuAnalytics({ query: { days: "all" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.analytics.days, "all");
    assert.deepEqual(res.body.analytics.today, {
      menuViews: 0,
      uniqueVisitors: 0,
      adImpressions: 0,
      adClicks: 0,
      clickRate: 0,
    });
  } finally {
    CafeMenuAnalytics.aggregate = originalAggregate;
    CafeMenuAnalytics.find = originalAnalyticsFind;
    Ad.find = originalFind;
  }
});

test("cafe analytics reports today's real ad impressions and clicks", async () => {
  const originalAggregate = CafeMenuAnalytics.aggregate;
  const originalAnalyticsFind = CafeMenuAnalytics.find;
  const originalFind = Ad.find;
  let aggregateCall = 0;
  CafeMenuAnalytics.aggregate = async () => {
    aggregateCall += 1;
    return aggregateCall === 2
      ? [{ menuViews: 7, uniqueVisitors: 5, adImpressions: 12, adClicks: 3 }]
      : [];
  };
  CafeMenuAnalytics.find = () => ({
    sort: () => ({
      select: () => ({
        limit: () => ({ lean: async () => [] }),
      }),
    }),
  });
  Ad.find = () => ({ select: () => ({ lean: async () => [] }) });

  try {
    const res = response();
    await getCafeMenuAnalytics({ query: { days: "1" } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.analytics.today, {
      menuViews: 7,
      uniqueVisitors: 5,
      adImpressions: 12,
      adClicks: 3,
      clickRate: 25,
    });
  } finally {
    CafeMenuAnalytics.aggregate = originalAggregate;
    CafeMenuAnalytics.find = originalAnalyticsFind;
    Ad.find = originalFind;
  }
});
