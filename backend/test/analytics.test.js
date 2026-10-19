const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { once } = require("node:events");
const AnalyticsEvent = require("../src/models/AnalyticsEvent");
const AnalyticsDedupe = require("../src/models/AnalyticsDedupe");
const Room = require("../src/models/room.model");
const Mess = require("../src/models/Mess");
const Villa = require("../src/models/Villa");
const Vehicle = require("../src/models/vehicle.model");
const FurnitureItem = require("../src/models/furnitureItem.model");
const analyticsRoutes = require("../src/routes/analytics.routes");
const {
  track,
  getOverview,
  getDateRange,
  getIndiaDayStart,
  saveEvent,
} = require("../src/controllers/analytics.controller");

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
  end() {
    return this;
  },
});

test("page-view events atomically deduplicate same session, type and entity for 30 minutes", async () => {
  const originalFindOneAndUpdate = AnalyticsDedupe.findOneAndUpdate;
  const originalDedupeCreate = AnalyticsDedupe.create;
  const originalCreate = AnalyticsEvent.create;
  const originalDeleteOne = AnalyticsDedupe.deleteOne;
  let saved = 0;
  const claimed = new Set();
  AnalyticsDedupe.findOneAndUpdate = async () => null;
  AnalyticsDedupe.create = async ({ key, expiresAt }) => {
    assert.equal(key, "visitor-session-123456789:listing_view:listing-123");
    assert.ok(expiresAt.getTime() - Date.now() > 29 * 60 * 1000);
    if (claimed.has(key)) {
      const error = new Error("Duplicate key");
      error.code = 11000;
      throw error;
    }
    claimed.add(key);
  };
  AnalyticsEvent.create = async () => { saved += 1; };
  AnalyticsDedupe.deleteOne = async () => {};
  try {
    const event = {
      type: "listing_view",
      entityType: "other",
      entityId: "listing-123",
      sessionId: "visitor-session-123456789",
      device: "desktop",
      source: "direct",
      area: "",
      searchQuery: "",
    };
    assert.equal(await saveEvent(event), true);
    assert.equal(await saveEvent(event), false);
    assert.equal(saved, 1);
  } finally {
    AnalyticsDedupe.findOneAndUpdate = originalFindOneAndUpdate;
    AnalyticsDedupe.create = originalDedupeCreate;
    AnalyticsEvent.create = originalCreate;
    AnalyticsDedupe.deleteOne = originalDeleteOne;
  }
});

test("click events are never deduplicated", async () => {
  const originalCreate = AnalyticsEvent.create;
  const originalDedupeCreate = AnalyticsDedupe.create;
  let saved = 0;
  AnalyticsDedupe.create = async () => { throw new Error("Click events should not claim a dedupe key"); };
  AnalyticsEvent.create = async () => { saved += 1; };
  try {
    const event = {
      type: "call_click",
      entityType: "other",
      entityId: "listing-123",
      sessionId: "visitor-session-123456789",
      device: "desktop",
      source: "direct",
      area: "",
      searchQuery: "",
    };
    await saveEvent(event);
    await saveEvent(event);
    assert.equal(saved, 2);
  } finally {
    AnalyticsEvent.create = originalCreate;
    AnalyticsDedupe.create = originalDedupeCreate;
  }
});
test("bots and malformed tracking payloads are acknowledged without saving", () => {
  const originalCreate = AnalyticsEvent.create;
  let saved = 0;
  AnalyticsEvent.create = async () => { saved += 1; };
  try {
    const botResponse = response();
    track({
      get: () => "Googlebot",
      body: { type: "page_view" },
    }, botResponse);
    const invalidResponse = response();
    track({
      get: () => "Mozilla/5.0",
      body: { type: "not-an-event" },
    }, invalidResponse);
    assert.equal(botResponse.statusCode, 204);
    assert.equal(invalidResponse.statusCode, 204);
    assert.equal(saved, 0);
  } finally {
    AnalyticsEvent.create = originalCreate;
  }
});

test("IST reporting boundaries start at midnight in Asia/Kolkata", () => {
  const boundary = getIndiaDayStart(new Date("2026-10-19T12:00:00.000Z"));
  assert.equal(boundary.toISOString(), "2026-10-18T18:30:00.000Z");
  const custom = getDateRange({ from: "2026-10-19", to: "2026-10-19" });
  assert.equal(custom.start.toISOString(), "2026-10-18T18:30:00.000Z");
  assert.equal(custom.end.toISOString(), "2026-10-19T18:29:59.999Z");
});

test("date ranges reject malformed, reversed, and longer-than-366-day intervals", () => {
  assert.equal(getDateRange({ range: "14d" }), null);
  assert.equal(getDateRange({ from: "2026-02-30", to: "2026-03-01" }), null);
  assert.equal(getDateRange({ from: "2026-03-01", to: "2026-02-28" }), null);
  assert.equal(getDateRange({ from: "2025-01-01", to: "2026-01-02" }), null);
});

test("owner overview constrains every aggregation to the authenticated owner", async () => {
  const originals = [AnalyticsEvent.aggregate, Room.find, Mess.find, Villa.find, Vehicle.find, FurnitureItem.find];
  const pipelines = [];
  AnalyticsEvent.aggregate = async (pipeline) => {
    pipelines.push(pipeline);
    return [];
  };
  for (const model of [Room, Mess, Villa, Vehicle, FurnitureItem]) {
    model.find = () => ({ select: () => ({ lean: async () => [] }) });
  }
  try {
    const res = response();
    await getOverview({
      user: { _id: "507f1f77bcf86cd799439011", role: "owner" },
      query: { range: "7d" },
    }, res);
    assert.equal(res.statusCode, 200);
    assert.ok(pipelines.length > 0);
    for (const pipeline of pipelines) {
      assert.equal(pipeline[0].$match.ownerId.toString(), "507f1f77bcf86cd799439011");
    }
  } finally {
    [AnalyticsEvent.aggregate, Room.find, Mess.find, Villa.find, Vehicle.find, FurnitureItem.find] = originals;
  }
});

test("public tracking route accepts JSON encoded as text/plain", async () => {
  const originalCreate = AnalyticsEvent.create;
  const originalDedupeCreate = AnalyticsDedupe.create;
  const originalFindOneAndUpdate = AnalyticsDedupe.findOneAndUpdate;
  let saved;
  let resolveSaved;
  const savedEvent = new Promise((resolve) => { resolveSaved = resolve; });
  AnalyticsDedupe.findOneAndUpdate = async () => null;
  AnalyticsDedupe.create = async () => {};
  AnalyticsEvent.create = async (event) => { saved = event; resolveSaved(); };
  const app = express();
  app.use(express.json());
  app.use("/api/analytics", analyticsRoutes);
  const server = app.listen(0);
  try {
    await once(server, "listening");
    const result = await fetch(`http://127.0.0.1:${server.address().port}/api/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "text/plain", "User-Agent": "Mozilla/5.0" },
      body: JSON.stringify({
        type: "page_view",
        entityType: "other",
        entityId: "/rooms",
        sessionId: "visitor-session-123456789",
        device: "desktop",
        source: "direct",
      }),
    });
    assert.equal(result.status, 204);
    await savedEvent;
    assert.equal(saved.type, "page_view");
    assert.equal(saved.entityId, "/rooms");
  } finally {
    server.close();
    AnalyticsEvent.create = originalCreate;
    AnalyticsDedupe.create = originalDedupeCreate;
    AnalyticsDedupe.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("overview returns 400 for an unsupported reporting range", async () => {
  const res = response();
  await getOverview({ user: { _id: "507f1f77bcf86cd799439011", role: "admin" }, query: { range: "14d" } }, res);
  assert.equal(res.statusCode, 400);
});
