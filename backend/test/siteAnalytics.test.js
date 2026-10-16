const test = require("node:test");
const assert = require("node:assert/strict");
const SiteAnalytics = require("../src/models/siteAnalytics.model");
const {
  trackPageDuration,
  trackPageView,
  getSiteTraffic,
} = require("../src/controllers/siteAnalytics.controller");

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

test("site page tracking rejects paths that contain query parameters", async () => {
  const res = response();
  await trackPageView({
    body: {
      visitorId: "visitor-session-123456789",
      path: "/rooms?phone=private",
      source: "Direct",
      referrer: "",
      platform: "Android",
      device: "Mobile",
    },
  }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("site page duration tracking rejects invalid duration values", async () => {
  const res = response();
  await trackPageDuration({ body: { eventId: "page-event-123456789", durationSeconds: -1 } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("site page duration tracking updates the matching visit", async () => {
  const originalUpdateOne = SiteAnalytics.updateOne;
  let update;
  SiteAnalytics.updateOne = async (...args) => { update = args; };

  try {
    const res = response();
    await trackPageDuration({ body: { eventId: "page-event-123456789", durationSeconds: 42 } }, res);
    assert.equal(res.statusCode, 202);
    assert.deepEqual(update, [
      { eventId: "page-event-123456789" },
      { $max: { durationSeconds: 42 } },
    ]);
  } finally {
    SiteAnalytics.updateOne = originalUpdateOne;
  }
});

test("site traffic validates supported reporting periods", async () => {
  const res = response();
  await getSiteTraffic({ query: { days: "14" } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("site traffic returns zeroed metrics when no page views are recorded", async () => {
  const originalAggregate = SiteAnalytics.aggregate;
  const originalFind = SiteAnalytics.find;
  SiteAnalytics.aggregate = async () => [];
  SiteAnalytics.find = () => ({
    sort: () => ({
      select: () => ({
        limit: () => ({ lean: async () => [] }),
      }),
    }),
  });

  try {
    const res = response();
    await getSiteTraffic({ query: { days: "7" } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.traffic.summary, {
      pageViews: 0,
      uniqueVisitors: 0,
      durationSeconds: 0,
      activeVisitors: 0,
    });
    assert.deepEqual(res.body.traffic.tracked, {
      pageViews: 0,
      uniqueVisitors: 0,
      durationSeconds: 0,
    });
    assert.equal(res.body.traffic.daily.length, 7);
    assert.deepEqual(res.body.traffic.sources, []);
    assert.deepEqual(res.body.traffic.platforms, []);
    assert.deepEqual(res.body.traffic.topPages, []);
    assert.deepEqual(res.body.traffic.recent, []);
  } finally {
    SiteAnalytics.aggregate = originalAggregate;
    SiteAnalytics.find = originalFind;
  }
});
