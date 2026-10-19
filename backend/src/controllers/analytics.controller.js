const mongoose = require("mongoose");
const { z } = require("zod");
const AnalyticsEvent = require("../models/AnalyticsEvent");
const AnalyticsDedupe = require("../models/AnalyticsDedupe");
const Room = require("../models/room.model");
const Mess = require("../models/Mess");
const Villa = require("../models/Villa");
const Vehicle = require("../models/vehicle.model");
const FurnitureItem = require("../models/furnitureItem.model");
const Cafe = require("../models/Cafe");

const eventTypes = [
  "page_view", "listing_view", "call_click", "whatsapp_click", "wishlist",
  "share", "search", "signup", "login", "menu_scan", "menu_item_view",
];
const entityTypes = ["room", "pg", "hostel", "flat", "mess", "villa", "vehicle", "furniture", "cafe", "other"];
const sources = ["google", "instagram", "whatsapp", "direct", "qr", "other"];
const trackSchema = z.object({
  type: z.enum(eventTypes),
  entityType: z.enum(entityTypes).optional().default("other"),
  entityId: z.union([z.string().max(100), z.number()]).optional().transform((value) => value == null ? "" : String(value)),
  sessionId: z.string().trim().min(16).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  device: z.enum(["mobile", "desktop", "tablet"]).optional(),
  source: z.enum(sources).optional().default("other"),
  area: z.string().trim().max(100).optional().default(""),
  searchQuery: z.string().trim().max(200).optional().default(""),
  resultCount: z.coerce.number().int().min(0).optional(),
});
const dedupedTypes = new Set(["listing_view", "page_view"]);

const getDevice = (agent = "") => {
  if (/ipad|tablet|playbook|silk/i.test(agent)) return "tablet";
  if (/mobile|iphone|ipod|android/i.test(agent)) return "mobile";
  return "desktop";
};

const getIndiaDayStart = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, Number(value)]));
  return new Date(Date.UTC(values.year, values.month - 1, values.day) - 330 * 60 * 1000);
};

const parseDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
};

const getDateRange = (query = {}, now = new Date()) => {
  const hasCustomDates = query.from != null || query.to != null;
  if (hasCustomDates) {
    if (query.from == null || query.to == null) return null;
    const fromDay = parseDate(String(query.from));
    const toDay = parseDate(String(query.to));
    if (!fromDay || !toDay || fromDay > toDay) return null;
    const days = Math.floor((toDay - fromDay) / 86400000) + 1;
    if (days > 366) return null;
    return {
      days,
      from: String(query.from),
      to: String(query.to),
      start: new Date(fromDay.getTime() - 330 * 60 * 1000),
      end: new Date(toDay.getTime() + 86400000 - 330 * 60 * 1000 - 1),
    };
  }

  const range = query.range || "7d";
  if (range === "today") {
    const start = getIndiaDayStart(now);
    return { days: 1, from: null, to: null, start, end: now };
  }
  const match = String(range).match(/^(7|30|90)d$/);
  if (!match) return null;
  const days = Number(match[1]);
  const todayStart = getIndiaDayStart(now);
  const start = new Date(todayStart.getTime() - (days - 1) * 86400000);
  return { days, from: null, to: null, start, end: now };
};

const previousRange = (range) => {
  const duration = range.end.getTime() - range.start.getTime() + 1;
  const end = new Date(range.start.getTime() - 1);
  const start = new Date(end.getTime() - duration + 1);
  return { ...range, start, end };
};

const getEntityAnalyticsData = async (entityType, entityId) => {
  if (!entityId || !mongoose.isValidObjectId(entityId)) return { ownerId: null, area: "" };
  const model = ["room", "pg", "hostel", "flat"].includes(entityType) ? Room
    : entityType === "mess" ? Mess
      : entityType === "villa" ? Villa
        : entityType === "vehicle" ? Vehicle
          : entityType === "furniture" ? FurnitureItem : null;
  if (!model) return { ownerId: null, area: "" };
  const entity = await model.findById(entityId).select("owner ownerId location area address").lean();
  return {
    ownerId: entity?.owner || entity?.ownerId || null,
    area: typeof entity?.location === "string" ? entity.location : entity?.area || entity?.address || "",
  };
};

const saveEvent = async (event, { user, agent = "" } = {}) => {
  let dedupeKey;
  if (dedupedTypes.has(event.type)) {
    dedupeKey = `${event.sessionId}:${event.type}:${event.entityId || ""}`;
    const now = Date.now();
    const expiresAt = new Date(now + 30 * 60 * 1000);
    const refreshed = await AnalyticsDedupe.findOneAndUpdate(
      { key: dedupeKey, expiresAt: { $lte: new Date(now) } },
      { $set: { expiresAt } },
      { new: true }
    );
    if (!refreshed) {
      try {
        await AnalyticsDedupe.create({ key: dedupeKey, expiresAt });
      } catch (error) {
        if (error.code === 11000) return false;
        throw error;
      }
    }
  }
  try {
    const entity = await getEntityAnalyticsData(event.entityType, event.entityId);
    await AnalyticsEvent.create({
      ...event,
      ownerId: entity.ownerId,
      area: event.area || entity.area,
      userId: user?._id && mongoose.isValidObjectId(user._id) ? user._id : null,
      device: event.device || getDevice(agent),
    });
    return true;
  } catch (error) {
    if (dedupeKey) await AnalyticsDedupe.deleteOne({ key: dedupeKey });
    throw error;
  }
};

const parseBody = (body) => {
  if (typeof body !== "string") return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const track = (req, res) => {
  const agent = req.get("user-agent") || "";
  if (/bot|crawler|spider|slurp|headless|googlebot|bingbot|facebookexternalhit/i.test(agent)) {
    return res.status(204).end();
  }
  const parsed = trackSchema.safeParse(parseBody(req.body));
  if (!parsed.success) return res.status(204).end();
  res.status(204).end();
  saveEvent(parsed.data, { user: req.user, agent })
    .catch((error) => console.error("ANALYTICS TRACK SAVE ERROR:", error));
};

const dateGroup = {
  $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" },
};
const indiaDate = (date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(date);
const fillDailyRows = (rows, range, fields) => {
  const start = new Date(`${range.from || indiaDate(range.start)}T00:00:00.000Z`);
  const byDate = new Map(rows.map((row) => [row.date, row]));
  return Array.from({ length: range.days }, (_, offset) => {
    const day = new Date(start);
    day.setUTCDate(day.getUTCDate() + offset);
    const date = day.toISOString().slice(0, 10);
    return byDate.get(date) || { date, ...Object.fromEntries(fields.map((field) => [field, 0])) };
  });
};
const sumType = (type) => ({ $sum: { $cond: [{ $eq: ["$type", type] }, 1, 0] } });
const countTotals = async (match) => {
  const [row] = await AnalyticsEvent.aggregate([
    { $match: match },
    { $group: {
      _id: null,
      views: sumType("listing_view"),
      pageViews: sumType("page_view"),
      calls: sumType("call_click"),
      whatsapp: sumType("whatsapp_click"),
      searches: sumType("search"),
      signups: sumType("signup"),
      wishlist: sumType("wishlist"),
      scans: sumType("menu_scan"),
      menuItemViews: sumType("menu_item_view"),
    } },
  ]);
  return row || { views: 0, pageViews: 0, calls: 0, whatsapp: 0, searches: 0, signups: 0, wishlist: 0, scans: 0, menuItemViews: 0 };
};

const compareResponse = async (range, match, totals) => {
  const previous = previousRange(range);
  const previousTotals = await countTotals({
    ...match,
    createdAt: { $gte: previous.start, $lte: previous.end },
  });
  const growth = {};
  for (const key of ["views", "pageViews", "calls", "whatsapp", "searches", "signups", "wishlist", "scans", "menuItemViews"]) {
    growth[key] = previousTotals[key] ? ((totals[key] - previousTotals[key]) / previousTotals[key]) * 100 : null;
  }
  return { totals: previousTotals, growth };
};

const getRangeOr400 = (req, res) => {
  const range = getDateRange(req.query);
  if (!range) {
    res.status(400).json({ success: false, message: "Use today, 7d, 30d, 90d, or valid from/to dates (maximum 366 days)." });
    return null;
  }
  return range;
};

const baseMatch = (range, query = {}) => {
  const match = { createdAt: { $gte: range.start, $lte: range.end } };
  if (query.category && entityTypes.includes(query.category)) match.entityType = query.category;
  if (query.area) match.area = String(query.area).slice(0, 100);
  return match;
};

const getLive = async (req, res) => {
  const range = getRangeOr400(req, res);
  if (!range) return;
  const now = new Date();
  const todayRange = { ...range, start: getIndiaDayStart(now), end: now, days: 1 };
  const match = baseMatch(todayRange);
  try {
    const [totals, activeRows, events] = await Promise.all([
      countTotals(match),
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getTime() - 5 * 60000), $lte: now } } },
        { $group: { _id: "$sessionId" } },
        { $count: "active" },
      ]),
      AnalyticsEvent.find({}).select("type entityType entityId area searchQuery device source createdAt").sort({ createdAt: -1 }).limit(20).lean(),
    ]);
    const responseTotals = {
      ...totals,
      conversion: totals.views ? ((totals.calls + totals.whatsapp) / totals.views) * 100 : 0,
    };
    const response = {
      success: true,
      live: {
        activeNow: activeRows[0]?.active || 0,
        totals: responseTotals,
        events,
      },
    };
    if (req.query.compare === "1") response.comparison = await compareResponse(todayRange, match, totals);
    return res.json(response);
  } catch (error) {
    console.error("ANALYTICS LIVE ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load live analytics" });
  }
};

const getOverview = async (req, res) => {
  const range = getRangeOr400(req, res);
  if (!range) return;
  const match = baseMatch(range, req.query);
  const ownerId = req.user.role === "owner" ? req.user._id : null;
  if (ownerId) {
    match.ownerId = new mongoose.Types.ObjectId(ownerId);
    match.entityType = req.query.category
      ? ["room", "pg", "hostel", "flat"].includes(req.query.category) ? req.query.category : "__none__"
      : { $in: ["room", "pg", "hostel", "flat"] };
  }

  try {
    const [
      totals,
      daily,
      listings,
      areas,
      owners,
      searches,
      zeroSearches,
      devices,
      sources,
      categoryViews,
      activeRows,
    ] = await Promise.all([
      countTotals(match),
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: {
          _id: dateGroup,
          views: sumType("listing_view"),
          calls: sumType("call_click"),
          whatsapp: sumType("whatsapp_click"),
          signups: sumType("signup"),
          searches: sumType("search"),
          wishlist: sumType("wishlist"),
        } },
        { $project: { _id: 0, date: "$_id", views: 1, calls: 1, whatsapp: 1, signups: 1, searches: 1, wishlist: 1 } },
        { $sort: { date: 1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...match, type: { $in: ["listing_view", "call_click", "whatsapp_click"] }, entityId: { $ne: "" } } },
        { $group: {
          _id: { entityId: "$entityId", entityType: "$entityType" },
          views: sumType("listing_view"),
          calls: sumType("call_click"),
          whatsapp: sumType("whatsapp_click"),
          area: { $first: "$area" },
          ownerId: { $first: "$ownerId" },
        } },
        { $sort: { views: -1 } },
        { $limit: req.user.role === "owner" ? 100 : 20 },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...match, type: "listing_view", area: { $ne: "" } } },
        { $group: { _id: "$area", views: { $sum: 1 } } },
        { $sort: { views: -1 } }, { $limit: 10 },
        { $project: { _id: 0, area: "$_id", views: 1 } },
      ]),
      req.user.role === "owner" ? Promise.resolve([]) : AnalyticsEvent.aggregate([
        { $match: { ...match, ownerId: { $ne: null }, type: { $in: ["listing_view", "call_click", "whatsapp_click"] } } },
        { $group: { _id: "$ownerId", views: sumType("listing_view"), calls: sumType("call_click"), whatsapp: sumType("whatsapp_click") } },
        { $sort: { views: -1 } }, { $limit: 10 },
        { $lookup: { from: "owners", localField: "_id", foreignField: "_id", as: "owner" } },
        { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, ownerId: "$_id", name: "$owner.name", views: 1, calls: 1, whatsapp: 1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...match, type: "search", searchQuery: { $ne: "" } } },
        { $group: { _id: "$searchQuery", count: { $sum: 1 }, results: { $avg: "$resultCount" } } },
        { $sort: { count: -1 } }, { $limit: 10 },
        { $project: { _id: 0, query: "$_id", count: 1, averageResults: "$results" } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...match, type: "search", resultCount: 0 } },
        { $group: { _id: "$searchQuery", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
        { $project: { _id: 0, query: "$_id", count: 1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: "$device", count: { $sum: 1 } } },
        { $project: { _id: 0, device: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: "$source", count: { $sum: 1 } } },
        { $project: { _id: 0, source: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...match, type: "listing_view" } },
        { $group: { _id: "$entityType", views: { $sum: 1 } } },
        { $project: { _id: 0, category: "$_id", views: 1 } },
        { $sort: { views: -1 } },
      ]),
      req.user.role === "owner" ? Promise.resolve([]) : AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 5 * 60000) } } },
        { $group: { _id: "$sessionId" } }, { $count: "active" },
      ]),
    ]);
    const filledDaily = fillDailyRows(daily, range, ["views", "calls", "whatsapp", "signups", "searches", "wishlist"]);

    const ids = [...new Set(listings.map((item) => item._id.entityId).filter((id) => mongoose.isValidObjectId(id)))];
    const [rooms, messes, villas, vehicles, furniture] = await Promise.all([
      Room.find({ _id: { $in: ids } }).select("title name category location").lean(),
      Mess.find({ _id: { $in: ids } }).select("name address").lean(),
      Villa.find({ _id: { $in: ids } }).select("name area").lean(),
      Vehicle.find({ _id: { $in: ids } }).select("name").lean(),
      FurnitureItem.find({ _id: { $in: ids } }).select("name").lean(),
    ]);
    const labels = new Map([...rooms, ...messes, ...villas, ...vehicles, ...furniture].map((item) => [
      String(item._id),
      { title: item.title || item.name || "Listing", area: item.location || item.address || item.area || "" },
    ]));
    const topListings = listings.map((row) => ({
      entityId: row._id.entityId,
      entityType: row._id.entityType,
      title: labels.get(row._id.entityId)?.title || "Listing",
      area: row.area || labels.get(row._id.entityId)?.area || "",
      views: row.views,
      calls: row.calls,
      whatsapp: row.whatsapp,
      contacts: row.calls + row.whatsapp,
      conversion: row.views ? ((row.calls + row.whatsapp) / row.views) * 100 : 0,
    }));
    const noContact = topListings.filter((item) => item.views > 0 && item.contacts === 0);
    const response = {
      success: true,
      analytics: {
        range: range.from ? { from: range.from, to: range.to } : `${range.days}d`,
        totals: {
          ...totals,
          conversion: totals.views ? ((totals.calls + totals.whatsapp) / totals.views) * 100 : 0,
        },
        daily: filledDaily,
        topListings: topListings.slice(0, 10),
        noContactListings: noContact,
        topAreas: areas,
        topOwners: owners,
        topSearches: searches,
        zeroResultSearches: zeroSearches,
        devices,
        sources,
        funnel: [
          { action: "Listing views", count: totals.views },
          { action: "Calls", count: totals.calls },
          { action: "WhatsApp", count: totals.whatsapp },
        ],
        categoryViews,
        activeNow: activeRows[0]?.active || 0,
      },
    };
    if (req.query.compare === "1") response.comparison = await compareResponse(range, match, totals);
    return res.json(response);
  } catch (error) {
    console.error("ANALYTICS OVERVIEW ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load analytics overview" });
  }
};

const getCafeAnalytics = async (req, res) => {
  const range = getRangeOr400(req, res);
  if (!range) return;
  try {
    const cafeId = req.params.cafeId;
    const cafe = mongoose.isValidObjectId(cafeId)
      ? await Cafe.findById(cafeId).select("slug").lean()
      : await Cafe.findOne({ slug: cafeId }).select("_id slug").lean();
    const cafeMatch = cafe
      ? { $in: [cafeId, String(cafe._id), cafe.slug].filter(Boolean) }
      : mongoose.isValidObjectId(cafeId)
        ? { $in: [cafeId, new mongoose.Types.ObjectId(cafeId)] }
        : cafeId;
    const match = { ...baseMatch(range), entityType: "cafe", entityId: cafeMatch };
    const [daily, peakHours, items, totals] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: { ...match, type: "menu_scan" } },
        { $group: { _id: dateGroup, scans: { $sum: 1 } } },
        { $project: { _id: 0, date: "$_id", scans: 1 } },
        { $sort: { date: 1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...match, type: "menu_scan" } },
        { $group: { _id: { $hour: { date: "$createdAt", timezone: "Asia/Kolkata" } }, scans: { $sum: 1 } } },
        { $project: { _id: 0, hour: "$_id", scans: 1 } },
        { $sort: { hour: 1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...match, type: "menu_item_view" } },
        { $group: { _id: "$searchQuery", views: { $sum: 1 } } },
        { $sort: { views: -1 } }, { $limit: 10 },
        { $project: { _id: 0, item: "$_id", views: 1 } },
      ]),
      countTotals(match),
    ]);
    const filledDaily = fillDailyRows(daily, range, ["scans"]);
    const response = {
      success: true,
      analytics: {
        range: range.from ? { from: range.from, to: range.to } : `${range.days}d`,
        totals: { ...totals, scans: totals.scans || 0, menuItemViews: totals.menuItemViews || 0 },
        daily: filledDaily,
        peakHours: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          scans: peakHours.find((row) => row.hour === hour)?.scans || 0,
        })),
        topItems: items,
      },
    };
    if (req.query.compare === "1") response.comparison = await compareResponse(range, match, totals);
    return res.json(response);
  } catch (error) {
    console.error("CAFE ANALYTICS OVERVIEW ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load cafe analytics" });
  }
};

module.exports = {
  track,
  getLive,
  getOverview,
  getCafeAnalytics,
  getDateRange,
  getIndiaDayStart,
  saveEvent,
  trackSchema,
};
