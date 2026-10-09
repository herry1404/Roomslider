const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildAssistantRoomQuery,
  extractAssistantFilters,
  fallbackFilters,
  sanitizeSearchMessage,
} = require("../src/services/aiAssistant.service");
const {
  buildHourlyRoomQuery,
  buildExploreServiceQuery,
  buildLaundryQuery,
  buildMessQuery,
  buildVillaQuery,
  buildVehicleQuery,
  detectFilters,
  detectIntent,
  makeReply,
  roomCard,
  villaCard,
} = require("../src/controllers/assistant.controller");

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

test("falls back to keyword filters when Gemini is not configured", async () => {
  const result = await extractAssistantFilters("PG under 6000", {
    env: {},
    fetchImpl: async () => assert.fail("Gemini should not be called without a key"),
  });
  assert.equal(result.category, null);
  assert.equal(result.keywords, null);
  assert.equal(fallbackFilters("Room under 6000").keywords, null);
  const areaSearch = await extractAssistantFilters("room near DAVV under 6000", { env: {} });
  assert.equal(areaSearch.keywords, "davv");
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

  test("detects Hinglish hourly and Explore-service searches without mapping unrelated queries to rooms", () => {
    assert.deepEqual(detectIntent("3 ghante ke liye room"), { type: "hourly" });
    assert.deepEqual(detectIntent("furniture on rent"), { type: "service", service: "furniture" });
    assert.deepEqual(detectIntent("hostel near Vijay Nagar"), { type: "rooms", category: "Hostel" });
    assert.deepEqual(detectIntent("weather tomorrow"), { type: "unavailable" });
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

test("routes vehicle, food, and short-stay queries to their own listing categories", () => {
  assert.deepEqual(detectIntent("show cars near Vijay Nagar"), { type: "vehicle", service: "vehicle" });
  assert.deepEqual(detectIntent("bike rental under 500"), { type: "vehicle", service: "vehicle" });
  assert.deepEqual(detectIntent("food or mess near Palasia"), { type: "mess" });
  assert.deepEqual(detectIntent("3 ghante ke liye room"), { type: "hourly" });
  assert.deepEqual(detectIntent("short stay in Vijay Nagar"), { type: "hourly" });
  assert.deepEqual(detectIntent("appliance repair"), { type: "service", service: "appliance-repair" });
  assert.deepEqual(detectIntent("electric car and bike"), { type: "vehicle", service: "vehicle" });
});

test("routes common RO and water-purifier spellings to Wi-Fi and RO services", () => {
  for (const query of ["RO", "R.O.", "R O purifier", "water purifier", "water filter"]) {
    assert.deepEqual(detectIntent(query), { type: "service", service: "wifi" }, query);
  }

  const query = buildExploreServiceQuery(
    { service: "wifi" },
    { searchText: "RO", area: null, maxPrice: null }
  );
  assert.deepEqual(query, { category: "wifi", isActive: true });
});

test("routes villa searches and builds area/budget-aware villa result cards", () => {
  assert.deepEqual(detectIntent("villa near Vijay Nagar under 10000"), { type: "villas" });
  assert.deepEqual(detectIntent("farmhouse for birthday party"), { type: "villas" });

  const query = buildVillaQuery(
    { maxPrice: 10000, area: "vijay nagar" },
    "villa near Vijay Nagar under 10000"
  );
  assert.equal(query.isActive, true);
  assert.deepEqual(query.nightlyRate, { $lte: 10000 });
  assert.equal(query.$and.length, 1);
  assert.ok(query.$and[0].$or.some((field) => field.area?.$regex === "vijay nagar"));

  const eventQuery = buildVillaQuery({ maxPrice: 25000 }, "villa for birthday party under 25000");
  assert.deepEqual(eventQuery.eventRate, { $lte: 25000 });
  assert.equal(eventQuery.$and, undefined);

  assert.deepEqual(villaCard({
    _id: "villa-id",
    name: "Green Villa",
    slug: "green-villa",
    area: "Vijay Nagar",
    city: "Indore",
    nightlyRate: 8000,
    eventRate: 25000,
    images: ["villa.jpg"],
  }), {
    type: "villa",
    title: "Green Villa",
    subtitle: "per night",
    category: "Villa",
    price: 8000,
    image: "villa.jpg",
    location: "Vijay Nagar, Indore",
    link: "/villas/green-villa",
    comingSoon: false,
  });
});

test("extracts area and price without treating query filler as search terms", () => {
  assert.deepEqual(detectFilters("sasta bike near Vijay Nagar under 500"), {
    maxPrice: 500,
    area: "vijay nagar",
    gender: null,
    amenities: [],
    cheapestFirst: true,
    perHour: false,
  });

  const vehicleQuery = buildVehicleQuery(
    { maxPrice: 500, area: "vijay nagar" },
    "Honda bike near Vijay Nagar under 500"
  );
  assert.equal(vehicleQuery.type, "Bike");
  assert.deepEqual(vehicleQuery.pricePerDay, { $lte: 500 });
  assert.equal(vehicleQuery.$and.length, 1);
  assert.ok(vehicleQuery.$and[0].$or.some((field) => field.brand?.$regex === "honda"));

  const combinedVehicleQuery = buildVehicleQuery({}, "car and bike rental");
  assert.deepEqual(combinedVehicleQuery.type, { $in: ["Car", "SUV", "Van", "Bike"] });
  const hourlyVehicleQuery = buildVehicleQuery(
    { maxPrice: 200, perHour: true },
    "bike under 200 per hour"
  );
  assert.deepEqual(hourlyVehicleQuery.pricePerHour, { $ne: null, $lte: 200 });

  const hourlyQuery = buildHourlyRoomQuery(
    { maxPrice: null, area: "vijay nagar" },
    "3 ghante ke liye room near Vijay Nagar"
  );
  assert.equal(hourlyQuery.isActive, true);
  assert.equal(hourlyQuery.status, "approved");
  assert.ok(hourlyQuery.$and.some((condition) => condition.$or.some((field) => field["location.city"])));
  assert.equal(hourlyQuery.$and.length, 1);

  const messQuery = buildMessQuery(
    { maxPrice: 100, area: "palasia" },
    "paneer tiffin near Palasia under 100"
  );
  assert.deepEqual(messQuery.pricePerPerson, { $lte: 100 });
  assert.equal(messQuery.$and.length, 2);
  assert.ok(messQuery.$and[1].$or.some((field) => field["todayMenu.items.name"]?.$regex === "paneer"));

  const laundryQuery = buildLaundryQuery(
    { maxPrice: 80, area: "palasia" },
    "dry cleaning near Palasia under 80"
  );
  assert.deepEqual(laundryQuery["catalog.price"], { $lte: 80 });
  assert.equal(laundryQuery.$and.length, 2);
  assert.ok(laundryQuery.$and[1].$or.some((field) => field["catalog.name"]?.$regex === "dry"));
});
