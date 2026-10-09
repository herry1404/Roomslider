const mongoose = require("mongoose");
const HomeSection = require("../models/homeSection.model");

const BUILT_IN = ["hero", "categories", "explore", "hourlyRooms", "villas"];
const CUSTOM = ["listings", "banner"];
const CATEGORIES = ["Room", "PG", "Hostel", "Flat"];
const TILE_ICONS = new Set([
  "BedDouble", "Users", "HeartHandshake", "PackageOpen", "HeartPulse", "Castle",
  "Banknote", "Bike", "UtensilsCrossed", "Shirt", "Sparkles", "Truck", "Sofa",
  "Wifi", "Wrench", "BookOpen", "FileText", "LayoutGrid",
]);

const DEFAULT_SECTIONS = [
  { type: "hero", title: "Hero", order: 0 },
  { type: "categories", title: "Categories", order: 1 },
  { type: "listings", title: "Rooms", order: 2, config: { category: "Room", limit: 10, viewAllPath: "/rooms" } },
  { type: "listings", title: "Flats", order: 3, config: { category: "Flat", limit: 10, viewAllPath: "/flats" } },
  { type: "listings", title: "PG", order: 4, config: { category: "PG", limit: 10, viewAllPath: "/pg" } },
  { type: "listings", title: "Hostels", order: 5, config: { category: "Hostel", limit: 10, viewAllPath: "/hostels" } },
  { type: "hourlyRooms", title: "Hourly / Short Stay", order: 6 },
  { type: "villas", title: "Villas", order: 7 },
  { type: "explore", title: "Explore", order: 8 },
];

// Pehli baar collection khaali ho to default layout bana do
let seedPromise = null;
const ensureDefaults = () => {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await HomeSection.countDocuments();
      if (count === 0) {
        await HomeSection.insertMany(DEFAULT_SECTIONS);
        return;
      }

      for (const sectionType of ["hourlyRooms", "villas"]) {
        const exists = await HomeSection.exists({ type: sectionType });
        if (exists) continue;

        const precedingTypes = sectionType === "villas"
          ? ["listings", "hourlyRooms"]
          : ["listings"];
        const precedingSections = await HomeSection.find({
          type: { $in: precedingTypes },
        }).select("order").lean();
        const exploreSection = await HomeSection.findOne({ type: "explore" })
          .select("order")
          .lean();
        const lastSection = await HomeSection.findOne().sort({ order: -1 }).select("order").lean();
        const insertOrder = precedingSections.length
          ? Math.max(...precedingSections.map((section) => section.order)) + 1
          : exploreSection?.order ?? ((lastSection?.order ?? -1) + 1);
        await HomeSection.updateMany(
          { order: { $gte: insertOrder } },
          { $inc: { order: 1 } }
        );
        await HomeSection.create({
          type: sectionType,
          title: sectionType === "hourlyRooms" ? "Hourly / Short Stay" : "Villas",
          order: insertOrder,
        });
      }
    })().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
};

const str = (v, max = 200) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

// Sirf apni site ka path (/...), // ya http se shuru nahi
const safePath = (v) => {
  const s = str(v, 200);
  return s.startsWith("/") && !s.startsWith("//") ? s : "";
};

// Banner ke liye: apna path ya https link (javascript: jaise links block)
const safeLink = (v) => {
  const s = str(v, 500);
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  return /^https?:\/\//i.test(s) ? s : "";
};

const cleanConfig = (type, input = {}) => {
  if (type === "listings") {
    const category = CATEGORIES.includes(input.category) ? input.category : "";
    let limit = parseInt(input.limit, 10);
    if (!limit || limit < 1) limit = 10;
    if (limit > 24) limit = 24;
    return {
      category,
      area: str(input.area, 80),
      college: str(input.college, 120),
      limit,
      viewAllPath: safePath(input.viewAllPath),
    };
  }
  if (type === "banner") {
    return {
      imageUrl: safeLink(input.imageUrl),
      text: str(input.text, 300),
      buttonText: str(input.buttonText, 40),
      linkUrl: safeLink(input.linkUrl),
    };
  }
  if (type === "explore") {
    return {
      tiles: (Array.isArray(input.tiles) ? input.tiles : [])
        .slice(0, 24)
        .map((tile) => ({
          icon: TILE_ICONS.has(tile.icon) ? tile.icon : "LayoutGrid",
          title: str(tile.title, 60),
          desc: str(tile.desc, 120),
          pill: str(tile.pill, 24) || "Explore",
          action: tile.action === "loan" ? "loan" : "link",
          to: tile.action === "loan" ? "" : safePath(tile.to),
        }))
        .filter((tile) => tile.title && (tile.action === "loan" || tile.to)),
    };
  }
  return {};
};

// PUBLIC: homepage ke liye, sirf enabled, order se
const getPublicSections = async (req, res) => {
  try {
    await ensureDefaults();
    const sections = await HomeSection.find({ enabled: true }).sort({ order: 1 });
    res.json({ success: true, sections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADMIN: saare sections (off wale bhi)
const getAllSections = async (req, res) => {
  try {
    await ensureDefaults();
    const sections = await HomeSection.find().sort({ order: 1 });
    res.json({ success: true, sections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSection = async (req, res) => {
  try {
    const { type, title, enabled, config } = req.body;
    if (!CUSTOM.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Sirf listings ya banner section bana sakte hain.",
      });
    }
    await ensureDefaults();
    const last = await HomeSection.findOne().sort({ order: -1 }).select("order");
    const section = await HomeSection.create({
      type,
      title: str(title, 80),
      enabled: enabled !== false,
      order: last ? last.order + 1 : 0,
      config: cleanConfig(type, config),
    });
    res.status(201).json({ success: true, section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSection = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const section = await HomeSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }
    if (req.body.title !== undefined) section.title = str(req.body.title, 80);
    if (typeof req.body.enabled === "boolean") section.enabled = req.body.enabled;
    if ((CUSTOM.includes(section.type) || section.type === "explore") && req.body.config) {
      section.config = cleanConfig(section.type, req.body.config);
    }
    await section.save();
    res.json({ success: true, section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSection = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const section = await HomeSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }
    if (BUILT_IN.includes(section.type)) {
      return res.status(400).json({
        success: false,
        message: "Built-in section delete nahi hota, sirf hide kar sakte ho.",
      });
    }
    await section.deleteOne();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Body: { ids: [id1, id2, ...] } naye order me, saare sections ke ids
const reorderSections = async (req, res) => {
  try {
    const { ids } = req.body;
    const total = await HomeSection.countDocuments();
    if (
      !Array.isArray(ids) ||
      ids.length !== total ||
      !ids.every((i) => mongoose.isValidObjectId(i))
    ) {
      return res.status(400).json({
        success: false,
        message: "Saare sections ke ids naye order me bhejo.",
      });
    }
    const ops = ids.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
    }));
    await HomeSection.bulkWrite(ops);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPublicSections,
  getAllSections,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
};
