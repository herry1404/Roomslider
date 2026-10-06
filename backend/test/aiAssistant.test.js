const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildAssistantRoomQuery,
  extractAssistantFilters,
  sanitizeSearchMessage,
} = require("../src/services/aiAssistant.service");
const { makeReply, roomCard } = require("../src/controllers/assistant.controller");

test("builds public-room query from assistant filters", () => {
  const query = buildAssistantRoomQuery({
    category: "Hostel",
    gender: "Female",
    minPrice: 3000,
    maxPrice: 6000,
    area: "Vijay Nagar",
    college: "DAVV",
    sharingType: "Double",
    keywords: "girls hostel",
  });

  assert.equal(query.status, "vacant");
  assert.equal(query.category, "Hostel");
  assert.deepEqual(query.gender, { $in: ["Female", "Any"] });
  assert.deepEqual(query.price, { $gte: 3000, $lte: 6000 });
  assert.equal(query.sharingType, "Double");
  assert.equal(query.$and.length, 3);
  assert.match(query.$and[0].$or[0].location.source, /Vijay Nagar/i);
  assert.match(query.$and[1].$or[0].title.source, /DAVV/i);
  assert.match(query.$and[2].$or[0].title.source, /girls/i);
});

test("sends only sanitized search text to Gemini JSON generation", async () => {
  let requestUrl;
  let requestOptions;
  const filters = {
    category: "PG",
    gender: null,
    minPrice: null,
    maxPrice: 6000,
    area: null,
    college: "DAVV",
    sharingType: null,
    keywords: null,
  };

  const result = await extractAssistantFilters(
    "PG near DAVV, call 9876543210 or email test@example.com",
    {
      env: { GEMINI_API_KEY: "test-key", GEMINI_MODEL: "gemini-test" },
      fetchImpl: async (url, options) => {
        requestUrl = url;
        requestOptions = options;
        return {
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: JSON.stringify(filters) }] } }],
          }),
        };
      },
      logger: { warn() {} },
    }
  );

  const requestBody = JSON.parse(requestOptions.body);
  assert.equal(result.category, "PG");
  assert.match(requestUrl, /models\/gemini-test:generateContent\?key=test-key$/);
  assert.equal(requestBody.generationConfig.responseMimeType, "application/json");
  assert.equal(requestBody.contents[0].parts[0].text, "PG near DAVV, call or email");
  assert.doesNotMatch(requestOptions.body, /9876543210|test@example\.com/);
  assert.equal(sanitizeSearchMessage("Flat near DAVV"), "Flat near DAVV");
});

test("requires a Gemini key before making a request", async () => {
  await assert.rejects(
    extractAssistantFilters("PG under 6000", {
      env: {},
      fetchImpl: async () => assert.fail("Gemini should not be called without a key"),
    }),
    { code: "GEMINI_API_KEY_MISSING" }
  );
});

test("builds a specific Hinglish reply from real rooms", () => {
  const rooms = [
    { title: "DAVV Girls PG", category: "PG", price: 3500, location: "Vijay Nagar" },
    { title: "Student PG", category: "PG", price: 5000, location: "Bhawarkuan" },
  ];

  assert.equal(
    makeReply("PG under 6000 chahiye", rooms, { category: "PG" }, 6),
    "Aapke liye 6 PGs mile. Sabse sasta ₹3,500, Vijay Nagar. Neeche dekho."
  );
});

test("maps a room to the shared API card contract", () => {
  const card = roomCard({
    _id: "room-id",
    title: "DAVV Girls PG",
    slug: "davv-girls-pg",
    category: "PG",
    price: 3500,
    location: "Vijay Nagar",
    images: ["room.jpg"],
    gender: "Female",
    sharingType: "Double",
  });

  assert.deepEqual(card, {
    type: "room",
    title: "DAVV Girls PG",
    subtitle: "Double · Girls",
    category: "PG",
    price: 3500,
    image: "room.jpg",
    location: "Vijay Nagar",
    link: "/pg/davv-girls-pg",
  });
});
