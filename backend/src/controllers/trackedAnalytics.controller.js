const { z } = require("zod");
const AnalyticsEvent = require("../models/analyticsEvent.model");

const trackedEventTypes = new Set(["page_view", "menu_view", "ad_click"]);
const botPattern = /bot|crawler|spider|slurp|headless|googlebot|bingbot|facebookexternalhit/i;

const trackedEventSchema = z.object({
  type: z.enum(["page_view", "menu_view", "ad_click"]),
  visitorId: z.string().regex(/^[a-zA-Z0-9_-]{16,80}$/),
  sessionId: z.string().regex(/^[a-zA-Z0-9_-]{16,80}$/),
  page: z.string().trim().regex(/^\/[^?#]*$/).max(200),
  cafeSlug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).optional(),
  adId: z.string().trim().min(1).max(100).optional(),
  adName: z.string().trim().min(1).max(120).optional(),
  referrer: z.string().trim().max(2048).optional(),
}).strict().superRefine((event, context) => {
  if (event.type === "menu_view" && !event.cafeSlug) {
    context.addIssue({ code: "custom", path: ["cafeSlug"], message: "Cafe slug is required for menu views" });
  }
  if (event.type === "ad_click" && (!event.adId || !event.adName)) {
    context.addIssue({ code: "custom", path: ["adId"], message: "Ad ID and name are required for ad clicks" });
  }
});

const getDevice = (agent = "") => {
  if (/ipad|tablet|playbook|silk/i.test(agent)) return "tablet";
  if (/mobile|iphone|ipod|android/i.test(agent)) return "mobile";
  return "desktop";
};

const parseBody = (body) => {
  if (typeof body !== "string") return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const cleanReferrer = (value) => {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.origin.slice(0, 200) : "";
  } catch {
    return "";
  }
};

const trackAnalyticsEvent = async (req, res, next) => {
  const body = parseBody(req.body);
  // The legacy tracker shares this endpoint and does not send the new page field.
  if (!body || !trackedEventTypes.has(body.type) || typeof body.page !== "string") return next();

  const agent = req.get("user-agent") || "";
  if (botPattern.test(agent)) return res.status(204).end();

  const parsed = trackedEventSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: "Invalid analytics event" });
  }

  try {
    const event = parsed.data;
    await AnalyticsEvent.create({
      ...event,
      referrer: cleanReferrer(event.referrer),
      device: getDevice(agent),
    });
    return res.status(202).json({ success: true });
  } catch (error) {
    console.error("PUBLIC ANALYTICS TRACK ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to record analytics event" });
  }
};

const getDateRange = (value, now = new Date()) => {
  const range = value || "7d";
  const days = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : null;
  if (!days) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const dateParts = Object.fromEntries(
    parts.filter(({ type }) => type !== "literal").map(({ type, value: part }) => [type, Number(part)])
  );
  const todayStart = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day) - 330 * 60 * 1000);
  const start = new Date(todayStart.getTime() - (days - 1) * 86400000);
  return { days, start, end: now };
};

const indiaDate = (date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(date);

const getRangeOr400 = (req, res) => {
  const range = getDateRange(req.query.range);
  if (!range) {
    res.status(400).json({ success: false, message: "Range must be today, 7d, or 30d" });
    return null;
  }
  return range;
};

const baseMatch = (range) => ({ createdAt: { $gte: range.start, $lte: range.end } });
const dateGroup = {
  $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" },
};
const sumType = (type) => ({ $sum: { $cond: [{ $eq: ["$type", type] }, 1, 0] } });

const fillDaily = (rows, range) => {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  return Array.from({ length: range.days }, (_, offset) => {
    const day = new Date(range.start.getTime() + offset * 86400000);
    const date = indiaDate(day);
    return byDate.get(date) || { date, pageViews: 0, uniqueVisitors: 0 };
  });
};

const getAnalyticsSummary = async (req, res) => {
  const range = getRangeOr400(req, res);
  if (!range) return;

  try {
    const [row] = await AnalyticsEvent.aggregate([
      { $match: baseMatch(range) },
      { $group: {
        _id: null,
        totalViews: sumType("page_view"),
        totalMenuViews: sumType("menu_view"),
        totalAdClicks: sumType("ad_click"),
        visitors: { $addToSet: { $cond: [{ $eq: ["$type", "page_view"] }, "$visitorId", null] } },
      } },
      { $project: {
        _id: 0,
        totalViews: 1,
        totalMenuViews: 1,
        totalAdClicks: 1,
        uniqueVisitors: { $size: { $setDifference: ["$visitors", [null]] } },
      } },
    ]);
    return res.json({
      success: true,
      data: { range: req.query.range || "7d", ...(row || { totalViews: 0, totalMenuViews: 0, totalAdClicks: 0, uniqueVisitors: 0 }) },
    });
  } catch (error) {
    console.error("ANALYTICS SUMMARY ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load analytics summary" });
  }
};

const getAnalyticsCafes = async (req, res) => {
  const range = getRangeOr400(req, res);
  if (!range) return;

  try {
    const cafes = await AnalyticsEvent.aggregate([
      { $match: { ...baseMatch(range), type: "menu_view", cafeSlug: { $nin: ["", null] } } },
      { $group: { _id: "$cafeSlug", menuViews: { $sum: 1 } } },
      { $project: { _id: 0, cafeSlug: "$_id", menuViews: 1 } },
      { $sort: { menuViews: -1, cafeSlug: 1 } },
    ]);
    return res.json({ success: true, data: { range: req.query.range || "7d", cafes } });
  } catch (error) {
    console.error("ANALYTICS CAFE REPORT ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load cafe analytics" });
  }
};

const getAnalyticsAds = async (req, res) => {
  const range = getRangeOr400(req, res);
  if (!range) return;

  try {
    const ads = await AnalyticsEvent.aggregate([
      { $match: {
        ...baseMatch(range),
        type: { $in: ["ad_impression", "ad_click"] },
        adId: { $exists: true, $ne: null },
      } },
      { $group: {
        _id: { $toString: "$adId" },
        adName: { $last: "$adName" },
        clicks: sumType("ad_click"),
        views: sumType("ad_impression"),
      } },
      { $project: {
        _id: 0,
        adId: "$_id",
        adName: { $ifNull: ["$adName", "$_id"] },
        clicks: 1,
        views: 1,
        ctr: { $cond: [{ $gt: ["$views", 0] }, { $multiply: [{ $divide: ["$clicks", "$views"] }, 100] }, null] },
      } },
      { $sort: { clicks: -1, adName: 1 } },
    ]);
    return res.json({ success: true, data: { range: req.query.range || "7d", ads } });
  } catch (error) {
    console.error("ANALYTICS AD REPORT ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load ad analytics" });
  }
};

const getAnalyticsVisitors = async (req, res) => {
  const range = getRangeOr400(req, res);
  if (!range) return;

  try {
    const [totalsRows, dailyRows, pages] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: { ...baseMatch(range), type: "page_view" } },
        { $group: { _id: null, totalViews: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
        { $project: { _id: 0, totalViews: 1, uniqueVisitors: { $size: "$visitors" } } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...baseMatch(range), type: "page_view" } },
        { $group: { _id: dateGroup, pageViews: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
        { $project: { _id: 0, date: "$_id", pageViews: 1, uniqueVisitors: { $size: "$visitors" } } },
        { $sort: { date: 1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...baseMatch(range), type: "page_view" } },
        { $group: { _id: "$page", pageViews: { $sum: 1 } } },
        { $project: { _id: 0, page: "$_id", pageViews: 1 } },
        { $sort: { pageViews: -1, page: 1 } },
      ]),
    ]);
    const totals = totalsRows[0] || { totalViews: 0, uniqueVisitors: 0 };
    return res.json({
      success: true,
      data: { range: req.query.range || "7d", ...totals, daily: fillDaily(dailyRows, range), pages },
    });
  } catch (error) {
    console.error("ANALYTICS VISITORS REPORT ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load visitor analytics" });
  }
};

module.exports = {
  trackAnalyticsEvent,
  getAnalyticsSummary,
  getAnalyticsCafes,
  getAnalyticsAds,
  getAnalyticsVisitors,
  getDateRange,
};
