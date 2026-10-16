const assert = require("node:assert/strict");
const test = require("node:test");
const Ad = require("../src/models/ad.model");
const { getPublicAds } = require("../src/controllers/ad.controller");

test("public cafe ads return up to ten ads from the most specific target per placement", async () => {
  const cafeTopAds = Array.from({ length: 11 }, (_, index) => ({
    _id: `cafe-${index}`,
    slot: "top",
    targetBy: "cafe",
    cafe: "wowpav",
    text: `Cafe ad ${index}`,
    logoUrl: `https://images.example/cafe-${index}.png`,
    linkUrl: `https://offers.example/cafe-${index}`,
  }));
  const records = [
    { _id: "all-top", slot: "top", targetBy: "all", text: "All ad", logoUrl: "https://images.example/all.png", linkUrl: "https://offers.example/all" },
    { _id: "location-top", slot: "top", targetBy: "location", text: "Location ad", logoUrl: "https://images.example/location.png", linkUrl: "https://offers.example/location" },
    ...cafeTopAds,
    { _id: "location-bottom", slot: "bottom", targetBy: "location", text: "Bottom ad", imageUrl: "https://images.example/bottom.png", linkUrl: "https://offers.example/bottom" },
  ];
  const query = {
    select() { return this; },
    sort() { return this; },
    lean: async () => records,
  };
  const originalFind = Ad.find;
  let queryFilter;
  Ad.find = (filter) => {
    queryFilter = filter;
    return query;
  };

  const response = {
    statusCode: 0,
    headers: {},
    set(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
  try {
    await getPublicAds({ query: { cafe: "wowpav", location: "bhawarkua" } }, response);
  } finally {
    Ad.find = originalFind;
  }

  assert.equal(response.statusCode, 200);
  const cafeTarget = queryFilter.$and[0].$or.find((target) => target.targetBy === "cafe");
  assert.deepEqual(cafeTarget.$or[1].cafes.$in, ["wowpav"]);
  assert.equal(response.payload.top.length, 10);
  assert.deepEqual(response.payload.top.map((ad) => ad.id), cafeTopAds.slice(0, 10).map((ad) => ad._id));
  assert.deepEqual(response.payload.bottom.map((ad) => ad.id), ["location-bottom"]);
});
