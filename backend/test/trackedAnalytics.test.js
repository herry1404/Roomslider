const test = require("node:test");
const assert = require("node:assert/strict");
const AnalyticsEvent = require("../src/models/analyticsEvent.model");
const {
  trackAnalyticsEvent,
  getAnalyticsSummary,
  getDateRange,
} = require("../src/controllers/trackedAnalytics.controller");
const { requireAdminKey } = require("../src/middleware/adminKey.middleware");

const response = () => ({
  statusCode: 200,
  body: null,
  ended: false,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  end() {
    this.ended = true;
    return this;
  },
});

const eventBody = {
  type: "menu_view",
  visitorId: "visitor-identifier-123456",
  sessionId: "session-identifier-123456",
  cafeSlug: "biryani-kendra",
  page: "/c/biryani-kendra/",
  referrer: "https://roomslider.in/some-page?email=private@example.com",
};

test("tracking saves only validated, privacy-limited analytics fields", async () => {
  const originalCreate = AnalyticsEvent.create;
  let savedEvent;
  AnalyticsEvent.create = async (event) => { savedEvent = event; };

  try {
    const res = response();
    await trackAnalyticsEvent({
      body: JSON.stringify(eventBody),
      get: () => "Mozilla/5.0 (iPhone; Mobile)",
    }, res, () => assert.fail("valid tracked events must not fall through"));

    assert.equal(res.statusCode, 202);
    assert.equal(savedEvent.type, "menu_view");
    assert.equal(savedEvent.cafeSlug, "biryani-kendra");
    assert.equal(savedEvent.device, "mobile");
    assert.equal(savedEvent.referrer, "https://roomslider.in");
    assert.equal(Object.hasOwn(savedEvent, "ip"), false);
    assert.equal(Object.hasOwn(savedEvent, "name"), false);
  } finally {
    AnalyticsEvent.create = originalCreate;
  }
});

test("tracking rejects missing ad metadata and unknown personal-data fields", async () => {
  const res = response();
  await trackAnalyticsEvent({
    body: { ...eventBody, type: "ad_click", adId: "homepage-banner", name: "not allowed" },
    get: () => "",
  }, res, () => assert.fail("tracked events must not fall through"));
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("tracking ignores crawler requests without storing events", async () => {
  const originalCreate = AnalyticsEvent.create;
  let saved = false;
  AnalyticsEvent.create = async () => { saved = true; };

  try {
    const res = response();
    await trackAnalyticsEvent({
      body: eventBody,
      get: (header) => header === "user-agent" ? "Googlebot" : "",
    }, res, () => assert.fail("crawler events must not fall through"));
    assert.equal(res.statusCode, 204);
    assert.equal(res.ended, true);
    assert.equal(saved, false);
  } finally {
    AnalyticsEvent.create = originalCreate;
  }
});

test("the new tracker leaves legacy page-view payloads on the existing handler", async () => {
  const res = response();
  let continued = false;
  await trackAnalyticsEvent({
    body: JSON.stringify({
      type: "page_view",
      entityType: "other",
      entityId: "/rooms",
      sessionId: "visitor-session-123456789",
      device: "desktop",
      source: "direct",
    }),
    get: () => "Mozilla/5.0",
  }, res, () => { continued = true; });
  assert.equal(continued, true);
  assert.equal(res.statusCode, 200);
});

test("date ranges include the current India day and reject unsupported values", () => {
  const now = new Date("2026-10-21T08:00:00.000Z");
  assert.equal(getDateRange("today", now).days, 1);
  assert.equal(getDateRange("7d", now).start.getTime(), getDateRange("30d", now).start.getTime() + 23 * 86400000);
  assert.equal(getDateRange("14d", now), null);
});

test("summary queries actual event aggregation and rejects invalid ranges", async () => {
  const originalAggregate = AnalyticsEvent.aggregate;
  let pipeline;
  AnalyticsEvent.aggregate = async (stages) => {
    pipeline = stages;
    return [];
  };

  try {
    const res = response();
    await getAnalyticsSummary({ query: { range: "today" } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.data, {
      range: "today",
      totalViews: 0,
      totalMenuViews: 0,
      totalAdClicks: 0,
      uniqueVisitors: 0,
    });
    assert.equal(pipeline[0].$match.type, undefined);

    const invalidRes = response();
    await getAnalyticsSummary({ query: { range: "all" } }, invalidRes);
    assert.equal(invalidRes.statusCode, 400);
  } finally {
    AnalyticsEvent.aggregate = originalAggregate;
  }
});

test("admin analytics key is required and compared from the request header", () => {
  const originalKey = process.env.ADMIN_KEY;
  const call = (key) => {
    const res = response();
    let advanced = false;
    requireAdminKey({ get: () => key }, res, () => { advanced = true; });
    return { res, advanced };
  };

  try {
    delete process.env.ADMIN_KEY;
    assert.equal(call("secret").res.statusCode, 503);
    process.env.ADMIN_KEY = "secret";
    assert.equal(call("wrong").res.statusCode, 401);
    assert.equal(call("secret").advanced, true);
  } finally {
    if (originalKey === undefined) delete process.env.ADMIN_KEY;
    else process.env.ADMIN_KEY = originalKey;
  }
});
