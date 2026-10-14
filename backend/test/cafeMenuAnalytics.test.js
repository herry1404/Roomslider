const test = require("node:test");
const assert = require("node:assert/strict");
const Ad = require("../src/models/ad.model");
const CafeMenuAnalytics = require("../src/models/cafeMenuAnalytics.model");
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

test("cafe ad analytics returns empty report data for a valid period", async () => {
  const originalAggregate = CafeMenuAnalytics.aggregate;
  const originalFind = Ad.find;
  CafeMenuAnalytics.aggregate = async () => [];
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
    assert.deepEqual(res.body.analytics.dailyViews, []);
    assert.deepEqual(res.body.analytics.byCafe, []);
    assert.deepEqual(res.body.analytics.byLocation, []);
    assert.deepEqual(res.body.analytics.adPerformance, []);
  } finally {
    CafeMenuAnalytics.aggregate = originalAggregate;
    Ad.find = originalFind;
  }
});

test("cafe ad analytics only accepts supported reporting periods", async () => {
  const res = response();
  await getCafeMenuAnalytics({ query: { days: "14" } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});
