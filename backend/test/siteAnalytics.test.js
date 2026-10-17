const test = require("node:test");
const assert = require("node:assert/strict");
const SiteAnalytics = require("../src/models/siteAnalytics.model");
const analyticsRoutes = require("../src/routes/analytics.routes");
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

test("site analytics route accepts URL-encoded page and duration beacons", async () => {
  const originalCreate = SiteAnalytics.create;
  const originalUpdateOne = SiteAnalytics.updateOne;
  let savedPageView;
  let savedDuration;
  SiteAnalytics.create = async (event) => { savedPageView = event; };
  SiteAnalytics.updateOne = async (...args) => { savedDuration = args; };

  const app = require("express")();
  app.use("/api/analytics", analyticsRoutes);
  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/analytics`;
    const pageResponse = await fetch(`${baseUrl}/page-view`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        visitorId: "visitor-session-123456789",
        eventId: "page-event-123456789",
        path: "/rooms",
        source: "Direct",
        referrer: "",
        platform: "Android",
        device: "Mobile",
      }),
    });
    const durationResponse = await fetch(`${baseUrl}/page-view-duration`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ eventId: "page-event-123456789", durationSeconds: "42" }),
    });

    assert.equal(pageResponse.status, 202);
    assert.equal(durationResponse.status, 202);
    assert.equal(savedPageView.path, "/rooms");
    assert.deepEqual(savedDuration[1], { $max: { durationSeconds: 42 } });
  } finally {
    server.close();
    SiteAnalytics.create = originalCreate;
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

  test("site traffic can report all retained history", async () => {
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
      await getSiteTraffic({ query: { days: "all" } }, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.traffic.days, "all");
      assert.deepEqual(res.body.traffic.daily, []);
    } finally {
      SiteAnalytics.aggregate = originalAggregate;
      SiteAnalytics.find = originalFind;
    }
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
