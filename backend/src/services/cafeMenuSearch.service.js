const CAFE_MENUS = [
  { id: "biryanikendra", name: "Biryani Kendra", location: "Sapna Sangeeta" },
  { id: "htlcafe", name: "HTL Cafe", location: "Indrapuri" },
  { id: "wowpav", name: "Wow Pav", location: "Bhawarkua" },
  { id: "waffleo", name: "Waffleo", location: "Bhawarkua" },
  { id: "yuvanamritulya", name: "Shri Yuvan Amrittulya", location: "Vishnupuri" },
];

const STOP_WORDS = new Set([
  "a", "an", "the", "where", "what", "which", "is", "are", "do", "you", "have", "can", "i",
  "has", "find", "search", "show", "tell", "me", "please", "menu", "menus", "item",
  "items", "available", "available", "cafe", "cafes", "near", "in", "at", "around",
  "for", "on", "ke", "ka", "ki", "kaha", "kidhar", "hai", "hain", "milega", "milta",
  "batao", "dikhao", "chahiye", "mujhe", "kya", "kahan",
]);

const HTML_ENTITIES = { "&amp;": "&", "&quot;": "\"", "&#39;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " " };
let cachedMenus = null;
let cacheExpiresAt = 0;
let pendingMenus = null;

const decodeHtml = (value) => value
  .replace(/&(?:amp|quot|#39|lt|gt|nbsp);/g, (entity) => HTML_ENTITIES[entity] || entity)
  .replace(/&#(\d+);/g, (_entity, code) => String.fromCharCode(Number(code)))
  .replace(/&#x([a-f\d]+);/gi, (_entity, code) => String.fromCharCode(parseInt(code, 16)));

const stripTags = (value) => decodeHtml(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const normalize = (value) => value.toLocaleLowerCase("en").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const itemRecord = (cafe, name, category, price) => ({
  cafe: cafe.name,
  location: cafe.location,
  name: name.trim(),
  category: category.trim(),
  price: price ? price.trim() : "",
  menuUrl: `https://www.roomslider.in/cafe/${normalize(cafe.location).replace(/\s+/g, "")}/${cafe.id === "htlcafe" ? "htl-cafe" : cafe.id}`,
});

const parseHtmlMenu = (html, cafe) => {
  const items = [];
  const sections = html.match(/<section\b[^>]*>[\s\S]*?<\/section>/gi) || [];
  for (const section of sections) {
    if (!/\bcat\b/i.test(section.slice(0, section.indexOf(">")))) continue;
    const heading = section.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
    const category = heading ? stripTags(heading[1]) : "";
    const rows = section.match(/<li\b[^>]*>[\s\S]*?<\/li>/gi) || [];
    for (const row of rows) {
      const nameMatch = row.match(/<(?:span|strong)\b[^>]*class=["'][^"']*\b(?:n|name)\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|strong)>/i);
      const name = nameMatch ? stripTags(nameMatch[1]) : "";
      if (!name) continue;
      const price = (stripTags(row).match(/₹\s*[\d,]+(?:\.\d+)?/g) || []).join(" / ");
      items.push(itemRecord(cafe, name, category, price));
    }
  }

  if (!items.length) {
    const sections = html.match(/<section\b[^>]*>[\s\S]*?<\/section>/gi) || [];
    for (const section of sections) {
      const heading = section.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
      const category = heading ? stripTags(heading[1]) : "";
      const rows = section.match(/<li\b[^>]*>[\s\S]*?<\/li>/gi) || [];
      for (const row of rows) {
        const nameMatch = row.match(/<span\b[^>]*class=["'][^"']*\bname\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
        if (!nameMatch) continue;
        const name = stripTags(nameMatch[1]);
        const price = (stripTags(row).match(/₹\s*[\d,]+(?:\.\d+)?/g) || []).join(" / ");
        items.push(itemRecord(cafe, name, category, price));
      }
    }
  }
  return items;
};

const parseDynamicWowPavMenu = (html) => {
  const dataStart = html.indexOf("var D=");
  const dataEnd = html.indexOf("var INFO=", dataStart);
  if (dataStart < 0 || dataEnd < 0) return [];
  const data = html.slice(dataStart, dataEnd);
  const waffleStart = data.indexOf('["Waffles","');
  if (waffleStart < 0) return [];
  const menus = [
    { data: data.slice(0, waffleStart), cafe: CAFE_MENUS.find(({ id }) => id === "wowpav") },
    { data: data.slice(waffleStart), cafe: CAFE_MENUS.find(({ id }) => id === "waffleo") },
  ];
  const items = [];
  for (const menu of menus) {
    const categoryPattern = /\["([^"]+)","[^"]*","([^"]*)"(?:,\s*1)?\]/g;
    let match;
    while ((match = categoryPattern.exec(menu.data))) {
      for (const entry of match[2].split("|")) {
        const item = entry.match(/^(.*?)\s+(ask|\d+(?:\.\d+)?)$/i);
        if (item) items.push(itemRecord(menu.cafe, item[1], match[1], item[2].toLowerCase() === "ask" ? "Ask for price" : `₹${item[2]}`));
      }
    }
  }
  return items;
};

const parseCafeMenu = (cafeId, html) => {
  if (cafeId === "wowpav") return parseDynamicWowPavMenu(html);
  const cafe = CAFE_MENUS.find((entry) => entry.id === cafeId);
  return cafe ? parseHtmlMenu(html, cafe) : [];
};

const loadMenus = async ({ fetchImpl = global.fetch, baseUrl = process.env.CAFE_MENU_ORIGIN || "https://www.roomslider.in" } = {}) => {
  const responseSets = await Promise.all(
    ["biryanikendra", "htlcafe", "wowpav", "yuvanamritulya"].map(async (cafeId) => {
      const response = await fetchImpl(`${baseUrl}/c/${cafeId}/index.html`, {
        headers: { Accept: "text/html" },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`Cafe menu request failed for ${cafeId}: HTTP ${response.status}`);
      return parseCafeMenu(cafeId, await response.text());
    })
  );
  return responseSets.flat();
};

const getMenus = async (options = {}) => {
  if (!options.fetchImpl && cachedMenus && cacheExpiresAt > Date.now()) return cachedMenus;
  if (!options.fetchImpl && pendingMenus) return pendingMenus;
  const request = loadMenus(options);
  if (options.fetchImpl) return request;
  pendingMenus = request
    .then((menus) => {
      cachedMenus = menus;
      cacheExpiresAt = Date.now() + 10 * 60 * 1000;
      return menus;
    })
    .finally(() => { pendingMenus = null; });
  return pendingMenus;
};

const getLocationFilter = (input) => {
  const value = normalize(input || "");
  if (!value) return "";
  const aliases = {
    bhawarkua: ["bhawarkua", "bhawarkuan", "bhawarkuwa", "bhanwarkua"],
    "sapna sangeeta": ["sapna sangeeta", "sapnasangeeta", "tower square"],
    indrapuri: ["indrapuri"],
    vishnupuri: ["vishnupuri", "vishnu puri"],
  };
  return Object.entries(aliases).find(([, names]) => names.some((name) => value.includes(normalize(name))))?.[0] || "";
};

const searchCafeMenus = async (message, { location = "", ...options } = {}) => {
  const source = normalize(message);
  const locationFilter = getLocationFilter(source) || getLocationFilter(location);
  const terms = source
    .split(" ")
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term))
    .filter((term) => !["bhawarkua", "bhawarkuan", "bhanwarkua", "indrapuri", "vishnupuri", "sapna", "sangeeta", "tower", "square"].includes(term));
  if (!terms.length) return { items: [], location: locationFilter };

  const menus = await getMenus(options);
  const items = menus.filter((item) => {
    if (locationFilter && normalize(item.location) !== normalize(locationFilter)) return false;
    const searchable = normalize(`${item.name} ${item.category}`);
    return terms.every((term) => searchable.includes(term));
  }).slice(0, 20);
  return { items, location: locationFilter };
};

module.exports = { CAFE_MENUS, getLocationFilter, parseCafeMenu, searchCafeMenus };
