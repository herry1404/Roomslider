const test = require("node:test");
const assert = require("node:assert/strict");
const User = require("../src/models/user.model");
const Room = require("../src/models/room.model");
const SearchEvent = require("../src/models/SearchEvent");
const PushHistory = require("../src/models/PushHistory");
const ListingEngagement = require("../src/models/ListingEngagement");
const { getAnalytics } = require("../src/controllers/admin.controller");

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

test("admin analytics can report all retained signup and search history", async () => {
  const originals = {
    userAggregate: User.aggregate,
    roomAggregate: Room.aggregate,
    searchAggregate: SearchEvent.aggregate,
    pushCount: PushHistory.countDocuments,
    listingCount: ListingEngagement.countDocuments,
  };
  const userPipelines = [];
  const searchPipelines = [];
  User.aggregate = async (pipeline) => {
    userPipelines.push(pipeline);
    return [{ _id: "2026-10-16", count: 2 }];
  };
  SearchEvent.aggregate = async (pipeline) => {
    searchPipelines.push(pipeline);
    return [{ _id: "2026-10-17", count: 3 }];
  };
  Room.aggregate = async () => [];
  PushHistory.countDocuments = async () => 0;
  ListingEngagement.countDocuments = async () => 0;

  try {
    const res = response();
    await getAnalytics({ query: { days: "all" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.analytics.days, "all");
    assert.deepEqual(res.body.analytics.dailyActivity, [
      { date: "2026-10-16", signups: 2, searches: 0 },
      { date: "2026-10-17", signups: 0, searches: 3 },
    ]);
    assert.deepEqual(userPipelines[0][0].$match, { role: "user" });
    assert.deepEqual(searchPipelines[0][0].$match, {});
  } finally {
    User.aggregate = originals.userAggregate;
    Room.aggregate = originals.roomAggregate;
    SearchEvent.aggregate = originals.searchAggregate;
    PushHistory.countDocuments = originals.pushCount;
    ListingEngagement.countDocuments = originals.listingCount;
  }
});
