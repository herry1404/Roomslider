const assert = require("node:assert/strict");
const test = require("node:test");
const Ad = require("../src/models/ad.model");
const { createAd } = require("../src/controllers/ad.controller");

test("creates one ad targeted to multiple selected cafes", async () => {
  const originalCreate = Ad.create;
  let savedAd;
  Ad.create = async (fields) => {
    savedAd = fields;
    return fields;
  };
  const response = {
    statusCode: 0,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };

  try {
    await createAd({
      body: {
        slot: "top",
        targetBy: "cafe",
        cafes: ["wowpav", "waffleo"],
        text: "Special offer",
        logoUrl: "https://images.example/ad.png",
        linkUrl: "https://offers.example",
        active: true,
      },
    }, response);
  } finally {
    Ad.create = originalCreate;
  }

  assert.equal(response.statusCode, 201);
  assert.equal(savedAd.cafe, "wowpav");
  assert.deepEqual(savedAd.cafes, ["wowpav", "waffleo"]);
});
