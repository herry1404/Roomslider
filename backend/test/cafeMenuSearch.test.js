const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { parseCafeMenu, searchCafeMenus } = require("../src/services/cafeMenuSearch.service");

const menuHtml = (cafe) => fs.readFileSync(
  path.join(__dirname, "../../frontend/public/c", cafe, "index.html"),
  "utf8"
);

test("parses cafe menu items and prices from the published menu pages", () => {
  const biryaniItems = parseCafeMenu("biryanikendra", menuHtml("biryanikendra"));
  assert.ok(biryaniItems.some((item) => item.name === "Awadhi Veg Biryani" && item.price === "₹ 30"));

  const htlItems = parseCafeMenu("htlcafe", menuHtml("htlcafe"));
  assert.ok(htlItems.some((item) => item.name === "Regular Chai" && item.price === "₹ 10"));

  const yuvanItems = parseCafeMenu("yuvanamritulya", menuHtml("yuvanamritulya"));
  assert.ok(yuvanItems.some((item) => item.name === "Jaggery Tea" && item.price === "₹10 / ₹20"));

  const wowpavAndWaffleo = parseCafeMenu("wowpav", menuHtml("wowpav"));
  assert.ok(wowpavAndWaffleo.some((item) => item.cafe === "Wow Pav" && item.name === "Aloo Tikki Burger"));
  assert.ok(wowpavAndWaffleo.some((item) => item.cafe === "Waffleo" && item.name === "Chocolate Waffle"));
});

test("Wow Pav menu reveal animation does not hide ad carousels", () => {
  const html = menuHtml("wowpav");
  assert.match(html, /main>section\{[^}]*opacity:0/);
  assert.doesNotMatch(html, /(?:^|})section\{[^}]*opacity:0/);
});

test("cafe ad carousels have no manual buttons and support touch swipes", () => {
  const html = menuHtml("wowpav");
  const adsScript = fs.readFileSync(
    path.join(__dirname, "../../frontend/public/cafe-ads.js"),
    "utf8"
  );
  assert.doesNotMatch(html, /ad-carousel-controls|data-ad-previous|data-ad-next/);
  assert.match(adsScript, /addEventListener\("touchstart"/);
  assert.match(adsScript, /addEventListener\("touchend"/);
});

test("searches cafe menus by item and filters results to the requested location", async () => {
  const pages = {
    biryanikendra: menuHtml("biryanikendra"),
    htlcafe: menuHtml("htlcafe"),
    wowpav: menuHtml("wowpav"),
    yuvanamritulya: menuHtml("yuvanamritulya"),
  };
  const fetchImpl = async (url) => {
    const cafe = new URL(url).pathname.split("/")[2];
    return { ok: true, status: 200, text: async () => pages[cafe] };
  };

  const allResults = await searchCafeMenus("Where can I find biryani?", { fetchImpl });
  assert.ok(allResults.items.some((item) => item.cafe === "Biryani Kendra"));

  const nearbyResults = await searchCafeMenus("biryani near Bhawarkua", { fetchImpl });
  assert.equal(nearbyResults.location, "bhawarkua");
  assert.equal(nearbyResults.items.length, 0);

  const requestedAreaOverridesCurrentMenu = await searchCafeMenus("biryani near Sapna Sangeeta", {
    location: "bhawarkua",
    fetchImpl,
  });
  assert.equal(requestedAreaOverridesCurrentMenu.location, "sapna sangeeta");
  assert.ok(requestedAreaOverridesCurrentMenu.items.every((item) => item.location === "Sapna Sangeeta"));

  const localCoffee = await searchCafeMenus("coffee", { location: "bhawarkua", fetchImpl });
  assert.ok(localCoffee.items.length > 0);
  assert.ok(localCoffee.items.every((item) => item.location === "Bhawarkua"));
});
