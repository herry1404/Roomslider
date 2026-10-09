const { z } = require("zod");
const Room = require("../models/room.model");
const HourlyRoom = require("../models/HourlyRoom.model");
const Villa = require("../models/Villa");
const Mess = require("../models/Mess");
const LaundryVendor = require("../models/laundryVendor.model");
const Vehicle = require("../models/vehicle.model");
const FurnitureItem = require("../models/furnitureItem.model");
const ServiceProvider = require("../models/service.model");
const { ensurePublicSlugs } = require("../utils/publicSlug");
const { ensureMessSlugs } = require("../utils/messSlug");
const { sanitizeRoomListing } = require("../utils/maskListingPhoneNumbers");
const {
  buildAssistantRoomQuery,
  extractAssistantFilters,
  sanitizeSearchMessage,
} = require("../services/aiAssistant.service");

const assistantMessageSchema = z.object({
  message: z.string().trim().min(1).max(300),
});

const ROOM_PATHS = { Room: "rooms", PG: "pg", Hostel: "hostels", Flat: "flats" };
const SERVICE_INTENTS = [
  { key: "vehicle", match: /\b(vehicle|bike|bikes|bicycle|scooty|scooter|car|cars|suv|van|motorcycle|motorbike|car rental|bike rental|car hire|gaadi|gadi)\b/i },
  { key: "furniture", match: /\b(furniture|bed|mattress|fridge|cooler|furniture rental|furniture on rent)\b/i },
  { key: "wifi", match: /\b(wi[\s-]?fi|broadband|r[\s.-]*o|water\s+(?:purifier|filter)|purifier)\b/i },
  { key: "packers", match: /\b(packers?|movers?|shifting|moving|relocation)\b/i },
  { key: "rent-agreement", match: /\b(rent agreement|rental agreement|lease agreement|police verification)\b/i },
  { key: "student-loan", match: /\b(student loan|education loan|loan for student|student loans)\b/i },
  { key: "study-support", match: /\b(study support|tutor|tuition|library|printing|study room)\b/i },
  { key: "cleaning", match: /\b(cleaning|cleaner|deep clean|housekeeping|bathroom cleaning)\b/i },
  { key: "appliance-repair", match: /\b(repair|appliance repair|ac repair|cooler repair|geyser repair|technician)\b/i },
];
const SERVICE_LABELS = {
  furniture: "Furniture rental",
  vehicle: "Vehicle rental",
  wifi: "Wi-Fi & RO",
  packers: "Packers & Movers",
  "rent-agreement": "Rent Agreement",
  "student-loan": "Student loan assistance",
  "study-support": "Study Support",
  cleaning: "Cleaning",
  "appliance-repair": "Appliance repair",
};
const SERVICE_SEARCH_TERMS = {
  wifi: ["wifi", "wi-fi", "broadband", "ro", "r.o.", "water", "purifier", "filter"],
};

function detectIntent(message) {
  const text = message.toLowerCase();
  if (/\b(mess|tiffin|thali|meal|meals|food|khana|lunch|dinner|nashta|breakfast|canteen)\b/i.test(text)) return { type: "mess" };
  if (/\b(laundry|dhobi|wash(?:ing)? clothes)\b/i.test(text)) return { type: "laundry" };
  if (/\b(villas?|farmhouses?|resorts?)\b/i.test(text)) return { type: "villas" };
  const service = SERVICE_INTENTS.find((intent) => intent.match.test(text));
  if (service) return { type: service.key === "vehicle" ? "vehicle" : "service", service: service.key };
  if (/\b(hourly|per hour|hours?|ghante?|ghanta|short[\s-]?stay|day[\s-]?use)\b/i.test(text)) {
    return { type: "hourly" };
  }
  const category = /\b(pg|paying guest)\b/i.test(text)
    ? "PG"
    : /\b(hostel|hostels)\b/i.test(text)
      ? "Hostel"
      : /\b(flat|flats|apartment)\b/i.test(text)
        ? "Flat"
        : /\b(room|rooms|stay|accommodation|rental|rent|kamra|ghar)\b/i.test(text)
          ? "Room"
          : null;
  return category ? { type: "rooms", category } : { type: "unavailable" };
}

function detectFilters(message) {
  const text = message.toLowerCase();
  const amount = text.match(/(?:under|below|less than|budget|upto|up to|₹|rs\.?)\s*([0-9]+(?:\.[0-9]+)?)\s*(k|thousand)?|([0-9]+(?:\.[0-9]+)?)\s*(k|thousand)?\s*(?:rupees|rs\.?)/i);
  const amountValue = amount?.[1] || amount?.[3];
  const amountUnit = amount?.[2] || amount?.[4];
  const price = amountValue ? Number(amountValue) * (amountUnit?.toLowerCase() === "k" || amountUnit?.toLowerCase() === "thousand" ? 1000 : 1) : null;
  const areaMatch = text.match(/\b(?:near|around|in|at|mein|me|ke paas)\s+(.+?)(?=\s+\b(?:under|below|less than|upto|up to|budget|for|chahiye|please)\b|$)/i);
  const knownArea = text.match(/\b(vijay nagar|bhawarkua|bhawar kuan|palasia|geeta bhawan|rau|bhanwarkua|scheme\s+\d+)\b/i);
  const candidateArea = (knownArea?.[1] || areaMatch?.[1])
    ?.replace(/\b(room|rooms|pg|hostel|hourly|short stay|mess|food|car|bike|vehicle|under|below|budget|for|chahiye|ke liye)\b.*$/i, "")
    .trim();
  const area = candidateArea && !/^(my college|near me|me|nearby)$/i.test(candidateArea)
    ? candidateArea.slice(0, 80)
    : null;
  const gender = /\b(girls?|ladki|ladkiyon|female)\b/i.test(text)
    ? "Female"
    : /\b(boys?|ladko|male)\b/i.test(text) ? "Male" : null;
  const amenity = [
    ["Wi-Fi", /\bwi[\s-]?fi\b/i],
    ["AC", /\b(ac|air conditioner)\b/i],
    ["Parking", /\bparking\b/i],
    ["Geyser", /\bgeyser|hot water\b/i],
    ["Attached Washroom", /\b(attached washroom|attached bathroom)\b/i],
    ["Meals", /\b(meals|food)\b/i],
  ].filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
  return {
    maxPrice: price,
    area: area || null,
    gender,
    amenities: amenity,
    cheapestFirst: /\b(sasta|sasti|saste|cheap|cheapest|affordable|budget)\b/i.test(text),
    perHour: /\b(hourly|per hour|\/\s*hour|an hour)\b/i.test(text),
  };
}

const SEARCH_STOP_WORDS = new Set([
  "a", "an", "the", "for", "with", "in", "at", "near", "nearby", "around", "ke", "ka", "ki", "ko", "me", "mein", "paas",
  "please", "want", "need", "looking", "find", "search", "show", "me", "chahiye", "karo", "hai", "hain",
  "my", "mujhe", "liye", "se", "par", "koi", "do", "dena",
  "under", "below", "less", "than", "upto", "up", "to", "budget", "cheap", "cheapest", "sasta",
  "sasti", "saste", "affordable", "hourly", "hours", "hour", "ghante", "ghanta", "short", "stay",
  "room", "rooms", "flat", "flats", "pg", "hostel", "mess", "food", "khana", "meal", "meals",
  "tiffin", "thali", "lunch", "dinner", "nashta", "breakfast", "canteen", "laundry", "dhobi",
  "vehicle", "rental", "rent", "hire", "bike", "bikes", "bicycle", "scooty", "scooter", "car",
  "cars", "suv", "van", "gaadi", "gadi", "furniture", "wifi", "broadband", "cleaning", "cleaner",
  "clean", "deep", "appliance", "repair", "on", "and", "the", "villa", "villas", "farmhouse",
  "farmhouses", "resort", "resorts", "event", "events", "party", "wedding", "birthday",
  "function", "stay", "accommodation", "property", "place", "search", "show", "find", "want",
  "need", "please", "under", "below", "less", "than", "upto", "up", "to", "budget", "rupees", "rs",
]);

function searchTerms(message, excluded = []) {
  const excludedTerms = new Set(excluded.flatMap((value) => String(value || "").toLowerCase().split(/\s+/)));
  return message.toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((term) => term.length > 1 && !SEARCH_STOP_WORDS.has(term) && !excludedTerms.has(term) && !/^\d+$/.test(term))
    .slice(0, 5);
}

function buildKeywordConditions(terms, fields) {
  return terms.map((term) => textFilter(fields, term));
}

function buildMessQuery(filters, message) {
  const query = { isActive: true };
  if (Number.isFinite(filters.maxPrice)) query.pricePerPerson = { $lte: filters.maxPrice };
  appendAreaFilter(query, ["address", "name"], filters.area);
  const terms = searchTerms(message, [filters.area]);
  if (terms.length) query.$and = [...(query.$and || []), ...buildKeywordConditions(
    terms,
    ["name", "address", "mealType", "todayMenu.items.name", "todayMenu.items.category", "addOns.name"]
  )];
  return query;
}

function buildVehicleQuery(filters, message) {
  const query = { isVisible: true, isAvailable: true, brand: { $exists: true } };
  const types = [];
  if (/\b(car|cars|suv|van)\b/i.test(message)) types.push("Car", "SUV", "Van");
  if (/\b(scooty|scooter)\b/i.test(message)) types.push("Scooty");
  if (/\b(bike|bikes|motorcycle|motorbike)\b/i.test(message)) types.push("Bike");
  if (types.length === 1) [query.type] = types;
  else if (types.length > 1) query.type = { $in: [...new Set(types)] };
  if (Number.isFinite(filters.maxPrice)) {
    query[filters.perHour ? "pricePerHour" : "pricePerDay"] = filters.perHour
      ? { $ne: null, $lte: filters.maxPrice }
      : { $lte: filters.maxPrice };
  }
  const terms = searchTerms(message, [filters.area]);
  if (terms.length) query.$and = buildKeywordConditions(terms, ["name", "brand", "type", "fuel", "transmission"]);
  return query;
}

function buildLaundryQuery(filters, message) {
  const query = { isActive: true };
  if (Number.isFinite(filters.maxPrice)) query["catalog.price"] = { $lte: filters.maxPrice };
  appendAreaFilter(query, ["area", "address", "vendorName"], filters.area);
  const terms = searchTerms(message, [filters.area]);
  if (terms.length) query.$and = [...(query.$and || []), ...buildKeywordConditions(terms, ["area", "address", "vendorName", "catalog.name"])];
  return query;
}

function roomCard(room) {
  const path = ROOM_PATHS[room.category] || "rooms";
  const card = {
    type: "room",
    title: room.title,
    subtitle: [room.sharingType, room.gender === "Female" ? "Girls" : room.gender === "Male" ? "Boys" : null]
      .filter(Boolean)
      .join(" · ") || room.category,
    category: room.category,
    price: room.price,
    image: room.images?.[0] || null,
    location: room.location,
    link: `/${path}/${room.slug || room._id}`,
  };
  if (room.hourlyEnabled === true) {
    card.hourlyEnabled = true;
    card.hourlySlabs = room.hourlySlabs || [];
  }
  return card;
}

function buildVillaQuery(filters = {}, message = "") {
  const query = { isActive: true };
  const isEventSearch = /\b(event|party|wedding|birthday|function)\b/i.test(message);
  const priceField = isEventSearch ? "eventRate" : "nightlyRate";
  if (Number.isFinite(filters.maxPrice)) query[priceField] = { $lte: filters.maxPrice };
  appendAreaFilter(query, ["area", "city", "address"], filters.area);
  const terms = searchTerms(message, [filters.area]);
  if (terms.length) {
    query.$and = [...(query.$and || []), ...buildKeywordConditions(
      terms,
      ["name", "description", "area", "city", "address", "amenities"]
    )];
  }
  return query;
}

function villaCard(villa, message = "") {
  const isEventSearch = /\b(event|party|wedding|birthday|function)\b/i.test(message);
  return serviceCard({
    type: "villa",
    title: villa.name,
    category: isEventSearch ? "Villa · Events" : "Villa",
    price: isEventSearch ? villa.eventRate : villa.nightlyRate,
    subtitle: isEventSearch ? "per day" : "per night",
    image: villa.images?.[0],
    location: [villa.area, villa.city].filter(Boolean).join(", "),
    link: `/villas/${villa.slug || villa._id}`,
  });
}

function hourlyRoomCard(room) {
  return serviceCard({
    type: "hourly",
    title: room.title,
    category: "Hourly / Short Stay",
    price: room.pricePerHour,
    subtitle: "per hour",
    image: room.images?.[0],
    location: [room.location?.address, room.location?.city].filter(Boolean).join(", "),
    link: `/hourly-rooms/${room.slug || room._id}`,
  });
}

function serviceCard({ type = "service", title, subtitle, category, price, image, location, link, comingSoon = false }) {
  return { type, title, subtitle, category, price, image, location, link, comingSoon };
}

function textFilter(fields, value) {
  if (!value) return null;
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 80);
  return { $or: fields.map((field) => ({ [field]: { $regex: escaped, $options: "i" } })) };
}

function appendAreaFilter(query, fields, area) {
  const areaFilter = textFilter(fields, area);
  if (areaFilter) query.$and = [...(query.$and || []), areaFilter];
}

async function getRoomResults(filters) {
  const query = buildAssistantRoomQuery(filters);
  if (filters.amenities?.length) {
    query.amenities = { $all: filters.amenities };
  }
  const rooms = await Room.find(query)
    .select("_id title slug category price location images gender sharingType hourlyEnabled hourlySlabs")
    .sort(filters.cheapestFirst ? { price: 1, priority: 1, createdAt: -1 } : { priority: 1, createdAt: -1 })
    .limit(6);
  await ensurePublicSlugs(Room, rooms, (room) => room.title);
  return {
    cards: rooms.map((room) => roomCard(sanitizeRoomListing(room))),
    total: await Room.countDocuments(query),
  };
}

async function getVillaResults(filters, message) {
  const query = buildVillaQuery(filters, message);
  const priceField = /\b(event|party|wedding|birthday|function)\b/i.test(message) ? "eventRate" : "nightlyRate";
  const villas = await Villa.find(query)
    .select("_id name slug area city address description images nightlyRate eventRate")
    .sort(filters.cheapestFirst ? { [priceField]: 1, createdAt: -1 } : { createdAt: -1 })
    .limit(6)
    .lean();
  await ensurePublicSlugs(Villa, villas, (villa) => villa.name);
  return {
    cards: villas.map((villa) => villaCard(villa, message)),
    total: await Villa.countDocuments(query),
  };
}

async function getMessResults(filters) {
  const query = buildMessQuery(filters, filters.searchText || "");
  let messes = await Mess.find(query)
    .select("name slug address pricePerPerson mealType images todayMenu.items.name ratingAverage ratingCount")
    .sort({ pricePerPerson: 1, ratingAverage: -1 })
    .limit(6);
  messes = await ensureMessSlugs(Mess, messes);
  return {
    cards: messes.map((mess) => serviceCard({
      type: "mess",
      title: mess.name,
      subtitle: `${mess.mealType || "Meals"} · ₹${Number(mess.pricePerPerson).toLocaleString("en-IN")} per person`,
      price: mess.pricePerPerson,
      image: mess.images?.[0],
      location: mess.address,
      link: `/mess/${mess.slug || mess._id}`,
    })),
    total: await Mess.countDocuments(query),
  };
}

function buildHourlyRoomQuery(filters, message) {
  const query = { isActive: true, status: "approved" };
  if (Number.isFinite(filters.maxPrice)) query.pricePerHour = { $lte: filters.maxPrice };
  appendAreaFilter(query, ["location.address", "location.city", "title"], filters.area);
  const terms = searchTerms(message, [filters.area]);
  if (terms.length) query.$and = [...(query.$and || []), ...buildKeywordConditions(terms, ["title", "description", "location.address", "location.city"])];
  return query;
}

async function getHourlyRoomResults(filters, message) {
  const query = buildHourlyRoomQuery(filters, message);
  const rooms = await HourlyRoom.find(query)
    .select("_id title slug description images location pricePerHour")
    .sort(filters.cheapestFirst ? { pricePerHour: 1, createdAt: -1 } : { createdAt: -1 })
    .limit(6)
    .lean();
  await ensurePublicSlugs(HourlyRoom, rooms, (room) => room.title);
  return {
    cards: rooms.map(hourlyRoomCard),
    total: await HourlyRoom.countDocuments(query),
  };
}

async function getLaundryResults(filters) {
  const query = buildLaundryQuery(filters, filters.searchText || "");
  const vendors = await LaundryVendor.find(query).sort({ vendorName: 1 }).limit(6).lean();
  await ensurePublicSlugs(LaundryVendor, vendors, (vendor) => vendor.vendorName);
  return {
    cards: vendors.map((vendor) => serviceCard({
      type: "laundry",
      title: vendor.vendorName,
      location: [vendor.area, vendor.address].filter(Boolean).join(", "),
      link: `/laundry/${vendor.slug || vendor._id}`,
    })),
    total: await LaundryVendor.countDocuments(query),
  };
}

async function getVehicleResults(filters, message) {
  const query = buildVehicleQuery(filters, message);
  const hourlyRate = filters.perHour === true;
  const vehicles = await Vehicle.find(query)
    .select("name brand slug type photos pricePerDay pricePerHour")
    .sort({ pricePerDay: 1 })
    .limit(6)
    .lean();
  await ensurePublicSlugs(Vehicle, vehicles, (vehicle) => `${vehicle.brand} ${vehicle.name}`);
  return {
    cards: vehicles.map((vehicle) => serviceCard({
      type: "service",
      title: `${vehicle.brand} ${vehicle.name}`,
      category: vehicle.type,
      price: hourlyRate ? vehicle.pricePerHour : vehicle.pricePerDay,
      subtitle: hourlyRate ? "per hour" : "per day",
      image: vehicle.photos?.[0],
      link: `/vehicles/${vehicle.slug || vehicle._id}`,
    })),
    total: await Vehicle.countDocuments(query),
  };
}

async function getFurnitureResults(filters) {
  const query = { isActive: true, isAvailable: true, "rentPlans.0": { $exists: true } };
  if (Number.isFinite(filters.maxPrice)) query["rentPlans.monthlyRent"] = { $lte: filters.maxPrice };
  const terms = searchTerms(filters.searchText || "", [filters.area]);
  if (terms.length) query.$and = buildKeywordConditions(terms, ["name", "category", "description"]);
  const items = await FurnitureItem.find(query)
    .select("name category description images rentPlans")
    .sort({ name: 1 })
    .limit(6)
    .lean();
  return {
    cards: items.map((item) => serviceCard({
      type: "service",
      title: item.name,
      category: item.category,
      price: item.rentPlans?.[0]?.monthlyRent,
      subtitle: "per month",
      image: item.images?.[0],
      link: "/furniture",
    })),
    total: await FurnitureItem.countDocuments(query),
  };
}

function buildExploreServiceQuery(intent, filters) {
  const category = intent.service;
  const query = { category, isActive: true };
  if (Number.isFinite(filters.maxPrice)) {
    query.$and = [{
      $or: [
        { price: { $lte: filters.maxPrice } },
        { "priceList.price": { $lte: filters.maxPrice } },
      ],
    }];
  }
  appendAreaFilter(query, ["area", "city", "serviceAreas", "name", "description"], filters.area);
  const terms = searchTerms(filters.searchText || "", [
    filters.area,
    ...(SERVICE_SEARCH_TERMS[category] || []),
  ]);
  if (terms.length) query.$and = [...(query.$and || []), ...buildKeywordConditions(terms, ["name", "subType", "description", "serviceAreas"])];
  return query;
}

async function getExploreServiceResults(intent, filters) {
  const category = intent.service;
  if (category === "student-loan") {
    return {
      cards: [serviceCard({
        title: SERVICE_LABELS[category],
        subtitle: "Explore student loan assistance",
        link: "/explore",
        comingSoon: false,
      })],
      total: 1,
      reply: "Student loan assistance ke liye Explore page dekhein.",
    };
  }
  const providerCategory = category;
  const query = buildExploreServiceQuery(intent, filters);
  const providers = await ServiceProvider.find(query)
    .select("category name area city price priceNote priceList images description")
    .sort({ isVerified: -1, name: 1 })
    .limit(6)
    .lean();
  if (providers.length) {
    return {
      cards: providers.map((provider) => serviceCard({
        type: "service",
        title: provider.name,
        category: SERVICE_LABELS[category] || provider.category,
        price: typeof provider.price === "number" ? provider.price : null,
        subtitle: provider.priceNote || provider.description,
        image: provider.images?.[0],
        location: [provider.area, provider.city].filter(Boolean).join(", "),
        link: `/services/${provider.category}`,
      })),
      total: await ServiceProvider.countDocuments(query),
    };
  }
  if (await ServiceProvider.exists({ category: providerCategory, isActive: true })) {
    return { cards: [], total: 0, reply: `Abhi ${SERVICE_LABELS[category]} ka matching result nahi mila. Area ya search badal kar try karein.` };
  }
  return {
    cards: [serviceCard({
      title: `${SERVICE_LABELS[category]} jaldi aa raha hai`,
      subtitle: `${SERVICE_LABELS[category]} ke updates Explore par dekhein.`,
      link: "/explore",
      comingSoon: true,
    })],
    total: 1,
    reply: `${SERVICE_LABELS[category]} jaldi aa raha hai. Explore page par baaki services dekhein.`,
  };
}

function roomReply(rooms, filters, intent) {
  if (!rooms.length) {
    return intent.type === "hourly"
      ? "Abhi matching Hourly / Short Stay listing nahi mili. Area ya per-hour budget badal kar try karein."
      : "Is search mein abhi matching room nahi mila. Area ya budget badal kar try karein.";
  }
  const label = intent.type === "hourly" ? "hourly rooms" : `${filters.category || "rooms"}`;
  const area = filters.area ? ` in ${filters.area}` : "";
  return `Found ${rooms.length} ${label}${area}. Neeche options dekhein.`;
}

function makeReply(message, rooms, filters, total) {
  if (total === 0) {
    return /[\u0900-\u097f]|\b(chahiye|mujhe|hai|hain|ladki|boys)\b/i.test(message)
      ? "Is search mein abhi room nahi mila. Budget ya area thoda badal kar try karein."
      : "I couldn't find a room for that search. Try loosening your budget or area.";
  }
  const prices = rooms.map((room) => Number(room.price)).filter(Number.isFinite);
  const lowestPrice = prices.length ? Math.min(...prices) : null;
  const category = filters.category || rooms[0]?.category;
  const area = filters.area || rooms.find((room) => room.location)?.location;
  const label = category === "PG" ? (total === 1 ? "PG" : "PGs")
    : category === "Hostel" ? (total === 1 ? "hostel" : "hostels")
      : category === "Flat" ? (total === 1 ? "flat" : "flats")
        : total === 1 ? "room" : "rooms";
  const priceText = lowestPrice === null ? "" : `Sabse sasta ₹${lowestPrice.toLocaleString("en-IN")}`;
  const details = [priceText, area].filter(Boolean).join(", ");
  if (/[\u0900-\u097f]|\b(chahiye|mujhe|hai|hain|ladki|boys)\b/i.test(message)) {
    return `Aapke liye ${total} ${label} mile.${details ? ` ${details}.` : ""} Neeche dekho.`;
  }
  return `Found ${total} ${label}${details ? `; ${details}` : ""}. See below.`;
}

async function postAssistantMessage(req, res) {
  const parsed = assistantMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Please enter a message of up to 300 characters.",
    });
  }

  try {
    const message = sanitizeSearchMessage(parsed.data.message);
    const intent = detectIntent(message);
    const localFilters = detectFilters(message);
    let extracted = {};
    if (intent.type === "rooms") {
      try {
        extracted = await extractAssistantFilters(message);
      } catch (error) {
        console.warn("AI ASSISTANT FILTER EXTRACTION FAILED:", error.message);
      }
    }
    const filters = {
      ...extracted,
      maxPrice: localFilters.maxPrice ?? extracted.maxPrice ?? null,
      gender: localFilters.gender || extracted.gender || null,
      amenities: localFilters.amenities.length ? localFilters.amenities : [],
      cheapestFirst: localFilters.cheapestFirst,
      category: intent.category || extracted.category || null,
      area: localFilters.area || extracted.area || null,
      keywords: extracted.keywords || null,
      searchText: message,
    };

    if (intent.type === "unavailable") {
      return res.status(200).json({
        reply: "Ye abhi RoomSlider pe available nahi hai. Aap rooms, Hourly / Short Stay, food/mess, car-bike rental, laundry ya Explore services search kar sakte hain.",
        suggestion: { label: "Explore available services", link: "/explore" },
        intent: "unavailable",
        filters,
        groups: [],
        results: [],
        cards: [],
        total: 0,
      });
    }

    let found;
    let label;
    if (intent.type === "rooms") {
      found = await getRoomResults(filters);
      label = "Rooms";
    } else if (intent.type === "villas") {
      found = await getVillaResults(filters, message);
      label = "Villas";
    } else if (intent.type === "hourly") {
      found = await getHourlyRoomResults(filters, message);
      label = "Hourly / Short Stay";
    } else if (intent.type === "mess") {
      found = await getMessResults(filters);
      label = "Mess";
    } else if (intent.type === "laundry") {
      found = await getLaundryResults(filters);
      label = "Services";
    } else if (intent.type === "vehicle") {
      found = await getVehicleResults(filters, message);
      label = /\b(car|cars|suv|van)\b/i.test(message)
        ? "Cars"
        : /\b(scooty|scooter)\b/i.test(message) ? "Scooty" : "Bikes & Vehicles";
    } else if (intent.service === "furniture") {
      found = await getFurnitureResults(filters);
      label = "Furniture";
    } else {
      found = await getExploreServiceResults(intent, filters);
      label = SERVICE_LABELS[intent.service] || "Services";
    }

    const groups = found.cards.length ? [{ label, results: found.cards }] : [];
    const reply = found.reply
      || (label === "Rooms" || label === "Hourly / Short Stay"
        ? roomReply(found.cards, filters, intent)
        : found.cards.length
          ? `Found ${found.cards.length} ${label.toLowerCase()} options. Neeche dekhein.`
          : `Abhi matching ${label.toLowerCase()} nahi mile. Area ya search badal kar try karein.`);
    const viewAllLink = intent.type === "mess" ? "/mess"
      : intent.type === "laundry" ? "/laundry"
        : intent.type === "villas" ? "/villas"
        : intent.type === "vehicle" ? "/vehicles"
          : intent.service === "furniture" ? "/furniture"
            : intent.type === "service" ? `/services/${intent.service}`
              : intent.type === "hourly" ? "/hourly-rooms" : "/rooms";

    return res.status(200).json({
      reply,
      intent: `${intent.type}_search`,
      filters,
      groups,
      results: found.cards,
      cards: found.cards,
      total: found.total,
      hasMore: found.total > found.cards.length,
      viewAllLink,
    });
  } catch (error) {
    console.error("AI ROOM ASSISTANT REQUEST FAILED:", error.message);
    return res.status(500).json({
      success: false,
      message: "Room search abhi complete nahi ho paayi. Please dobara try karein.",
    });
  }
}

module.exports = {
  buildHourlyRoomQuery,
  buildLaundryQuery,
  buildMessQuery,
  buildExploreServiceQuery,
  buildVillaQuery,
  buildVehicleQuery,
  detectFilters,
  detectIntent,
  makeReply,
  postAssistantMessage,
  roomCard,
  villaCard,
};
