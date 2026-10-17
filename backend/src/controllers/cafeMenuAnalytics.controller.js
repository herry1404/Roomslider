const mongoose = require("mongoose");
const { z } = require("zod");
const Ad = require("../models/ad.model");
const CafeMenuAnalytics = require("../models/cafeMenuAnalytics.model");

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
const trackSchema = z.object({
  type: z.enum(["menu_view", "ad_impression", "ad_click"]),
  cafe: slug,
  location: slug,
  visitorId: z.string().regex(/^[a-zA-Z0-9-]{16,80}$/),
  source: z.string().trim().min(1).max(100).optional(),
  platform: z.enum(["Android", "iOS", "Windows", "macOS", "Linux", "Other"]).optional(),
  adId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
}).superRefine((event, context) => {
  if (event.type !== "menu_view" && !event.adId) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "An ad ID is required for ad events", path: ["adId"] });
  }
});

const trackCafeMenuEvent = async (req, res) => {
  const parsed = trackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: "Invalid cafe analytics event" });
  }

  try {
    const event = parsed.data;
    if (event.adId && !(await Ad.exists({ _id: event.adId }))) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }
    await CafeMenuAnalytics.create(event);
    return res.status(202).json({ success: true });
  } catch (error) {
    console.error("TRACK CAFE MENU EVENT ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to record cafe analytics" });
  }
};

const getIndiaDayStart = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map(({ type, value }) => [type, Number(value)])
  );
  return new Date(Date.UTC(values.year, values.month - 1, values.day) - (330 * 60 * 1000));
};

const getCafeMenuAnalytics = async (req, res) => {
  const requestedDays = req.query.days || "30";
  const allTime = requestedDays === "all";
  const days = Number(requestedDays);
  if (!allTime && ![1, 7, 30, 90].includes(days)) {
    return res.status(400).json({ success: false, message: "Analytics range must be 1, 7, 30, or 90 days, or all" });
  }

  try {
    const now = new Date();
    const todayStart = getIndiaDayStart(now);
    const start = allTime ? null : new Date(todayStart.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    const match = allTime ? {} : { createdAt: { $gte: start, $lte: now } };
    const todayMatch = { createdAt: { $gte: todayStart, $lte: now } };
    const [summaryRows, todayRows, dailyRows, cafeRows, locationRows, adRows, sourceRows, platformRows, recentRows] = await Promise.all([
      CafeMenuAnalytics.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            menuViews: { $sum: { $cond: [{ $eq: ["$type", "menu_view"] }, 1, 0] } },
            adImpressions: { $sum: { $cond: [{ $eq: ["$type", "ad_impression"] }, 1, 0] } },
            adClicks: { $sum: { $cond: [{ $eq: ["$type", "ad_click"] }, 1, 0] } },
            visitors: { $addToSet: { $cond: [{ $eq: ["$type", "menu_view"] }, "$visitorId", null] } },
          },
        },
        {
          $project: {
            menuViews: 1,
            adImpressions: 1,
            adClicks: 1,
            uniqueVisitors: { $size: { $setDifference: ["$visitors", [null]] } },
          },
        },
      ]),
      CafeMenuAnalytics.aggregate([
        { $match: todayMatch },
        {
          $group: {
            _id: null,
            menuViews: { $sum: { $cond: [{ $eq: ["$type", "menu_view"] }, 1, 0] } },
            adImpressions: { $sum: { $cond: [{ $eq: ["$type", "ad_impression"] }, 1, 0] } },
            adClicks: { $sum: { $cond: [{ $eq: ["$type", "ad_click"] }, 1, 0] } },
            visitors: { $addToSet: { $cond: [{ $eq: ["$type", "menu_view"] }, "$visitorId", null] } },
          },
        },
        {
          $project: {
            menuViews: 1,
            adImpressions: 1,
            adClicks: 1,
            uniqueVisitors: { $size: { $setDifference: ["$visitors", [null]] } },
          },
        },
      ]),
      CafeMenuAnalytics.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
            views: { $sum: { $cond: [{ $eq: ["$type", "menu_view"] }, 1, 0] } },
            adImpressions: { $sum: { $cond: [{ $eq: ["$type", "ad_impression"] }, 1, 0] } },
            adClicks: { $sum: { $cond: [{ $eq: ["$type", "ad_click"] }, 1, 0] } },
            visitors: { $addToSet: { $cond: [{ $eq: ["$type", "menu_view"] }, "$visitorId", null] } },
          },
        },
        {
          $project: {
            date: "$_id",
            views: 1,
            adImpressions: 1,
            adClicks: 1,
            uniqueVisitors: { $size: { $setDifference: ["$visitors", [null]] } },
          },
        },
        { $sort: { date: 1 } },
      ]),
      CafeMenuAnalytics.aggregate([
        { $match: { ...match, type: "menu_view" } },
        { $group: { _id: { cafe: "$cafe", location: "$location" }, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
        { $project: { cafe: "$_id.cafe", location: "$_id.location", views: 1, uniqueVisitors: { $size: "$visitors" } } },
        { $sort: { views: -1, cafe: 1 } },
        { $limit: 100 },
      ]),
      CafeMenuAnalytics.aggregate([
        { $match: { ...match, type: "menu_view" } },
        { $group: { _id: "$location", views: { $sum: 1 }, cafes: { $addToSet: "$cafe" }, visitors: { $addToSet: "$visitorId" } } },
        { $project: { location: "$_id", views: 1, cafeCount: { $size: "$cafes" }, uniqueVisitors: { $size: "$visitors" } } },
        { $sort: { views: -1, location: 1 } },
      ]),
      CafeMenuAnalytics.aggregate([
        { $match: { ...match, type: { $in: ["ad_impression", "ad_click"] }, adId: { $type: "objectId" } } },
        {
          $group: {
            _id: { adId: "$adId", cafe: "$cafe", location: "$location" },
            impressions: { $sum: { $cond: [{ $eq: ["$type", "ad_impression"] }, 1, 0] } },
            clicks: { $sum: { $cond: [{ $eq: ["$type", "ad_click"] }, 1, 0] } },
          },
        },
        { $sort: { impressions: -1, clicks: -1 } },
        { $limit: 100 },
      ]),
      CafeMenuAnalytics.aggregate([
        { $match: { ...match, type: "menu_view" } },
        { $group: { _id: "$source", views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
        { $project: { source: { $ifNull: ["$_id", "Direct"] }, views: 1, uniqueVisitors: { $size: "$visitors" } } },
        { $sort: { views: -1, source: 1 } },
        { $limit: 10 },
      ]),
      CafeMenuAnalytics.aggregate([
        { $match: { ...match, type: "menu_view" } },
        { $group: { _id: "$platform", views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
        { $project: { platform: { $ifNull: ["$_id", "Other"] }, views: 1, uniqueVisitors: { $size: "$visitors" } } },
        { $sort: { views: -1, platform: 1 } },
      ]),
      CafeMenuAnalytics.find(match)
        .sort({ createdAt: -1 })
        .select("type cafe location adId createdAt")
        .limit(20)
        .lean(),
    ]);

    const adIds = [...new Set([
      ...adRows.map((row) => row._id.adId.toString()),
      ...recentRows.filter((row) => row.adId).map((row) => row.adId.toString()),
    ])]
      .filter((id) => mongoose.isValidObjectId(id));
    const ads = await Ad.find({ _id: { $in: adIds } }).select("text slot targetBy cafe location").lean();
    const adsById = new Map(ads.map((ad) => [ad._id.toString(), ad]));
    const makeSummary = (row = {}) => {
      const summary = {
        menuViews: row.menuViews || 0,
        uniqueVisitors: row.uniqueVisitors || 0,
        adImpressions: row.adImpressions || 0,
        adClicks: row.adClicks || 0,
      };
      summary.clickRate = summary.adImpressions
        ? Number(((summary.adClicks / summary.adImpressions) * 100).toFixed(2))
        : 0;
      return summary;
    };

    const dailyTrend = allTime ? dailyRows : (() => {
      const dailyByDate = new Map(dailyRows.map((row) => [row.date, row]));
      const rows = [];
      for (let offset = 0; offset < days; offset += 1) {
        const day = new Date(start.getTime() + offset * 24 * 60 * 60 * 1000);
        const date = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(day);
        rows.push(dailyByDate.get(date) || {
          date,
          views: 0,
          adImpressions: 0,
          adClicks: 0,
          uniqueVisitors: 0,
        });
      }
      return rows;
    })();

    return res.status(200).json({
      success: true,
      analytics: {
        days: allTime ? "all" : days,
        from: start,
        to: now,
        summary: {
          ...makeSummary(summaryRows[0]),
        },
        today: makeSummary(todayRows[0]),
        dailyViews: dailyTrend,
        byCafe: cafeRows,
        byLocation: locationRows,
        bySource: sourceRows,
        byPlatform: platformRows,
        recentEvents: recentRows.map((row) => ({
          type: row.type,
          cafe: row.cafe,
          location: row.location,
          ad: row.adId ? (adsById.get(row.adId.toString())?.text || "Deleted ad") : "",
          createdAt: row.createdAt,
        })),
        adPerformance: adRows.map((row) => {
          const ad = adsById.get(row._id.adId.toString());
          return {
            adId: row._id.adId,
            cafe: row._id.cafe,
            location: row._id.location,
            impressions: row.impressions,
            clicks: row.clicks,
            clickRate: row.impressions ? Number(((row.clicks / row.impressions) * 100).toFixed(2)) : 0,
            text: ad?.text || "Deleted ad",
            slot: ad?.slot || "",
          };
        }),
      },
    });
  } catch (error) {
    console.error("CAFE MENU ANALYTICS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load cafe analytics" });
  }
};

module.exports = { trackCafeMenuEvent, getCafeMenuAnalytics };
