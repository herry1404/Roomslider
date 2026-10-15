const test = require("node:test");
const assert = require("node:assert/strict");
const SiteAnalytics = require("../src/models/siteAnalytics.model");
const {
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
      activeVisitors: 0,
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
