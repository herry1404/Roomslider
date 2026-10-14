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

const getCafeMenuAnalytics = async (req, res) => {
  const days = Number(req.query.days || 30);
  if (![7, 30, 90].includes(days)) {
    return res.status(400).json({ success: false, message: "Analytics range must be 7, 30, or 90 days" });
  }

  try {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - days + 1);
    const match = { createdAt: { $gte: start } };
    const [summaryRows, dailyRows, cafeRows, locationRows, adRows] = await Promise.all([
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
        { $match: { ...match, type: "menu_view" } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
        { $project: { date: "$_id", views: 1, uniqueVisitors: { $size: "$visitors" } } },
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
    ]);

    const adIds = [...new Set(adRows.map((row) => row._id.adId.toString()))]
      .filter((id) => mongoose.isValidObjectId(id));
    const ads = await Ad.find({ _id: { $in: adIds } }).select("text slot targetBy cafe location").lean();
    const adsById = new Map(ads.map((ad) => [ad._id.toString(), ad]));
    const summary = summaryRows[0] || { menuViews: 0, uniqueVisitors: 0, adImpressions: 0, adClicks: 0 };

    return res.status(200).json({
      success: true,
      analytics: {
        days,
        from: start,
        to: new Date(),
        summary: {
          ...summary,
          clickRate: summary.adImpressions ? Number(((summary.adClicks / summary.adImpressions) * 100).toFixed(2)) : 0,
        },
        dailyViews: dailyRows,
        byCafe: cafeRows,
        byLocation: locationRows,
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
