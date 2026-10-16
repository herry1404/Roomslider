const { z } = require("zod");
const SiteAnalytics = require("../models/siteAnalytics.model");

const trackSchema = z.object({
  visitorId: z.string().regex(/^[a-zA-Z0-9-]{16,80}$/),
  eventId: z.string().regex(/^[a-zA-Z0-9-]{16,80}$/).optional(),
  path: z.string().regex(/^\/[^?#]*$/).max(160),
  source: z.string().trim().min(1).max(100).default("Direct"),
  referrer: z.string().trim().max(100).default(""),
  platform: z.enum(["Android", "iOS", "Windows", "macOS", "Linux", "Other"]),
  device: z.enum(["Mobile", "Desktop"]),
  durationSeconds: z.number().int().min(0).max(43200).optional(),
});

const durationSchema = z.object({
  eventId: z.string().regex(/^[a-zA-Z0-9-]{16,80}$/),
  durationSeconds: z.number().int().min(0).max(43200),
});

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

const trackPageView = async (req, res) => {
  const parsed = trackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: "Invalid page view" });
  }

  try {
    await SiteAnalytics.create(parsed.data);
    return res.status(202).json({ success: true });
  } catch (error) {
    console.error("TRACK SITE PAGE VIEW ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to record page view" });
  }
};

const trackPageDuration = async (req, res) => {
  const parsed = durationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: "Invalid page duration" });
  }

  try {
    await SiteAnalytics.updateOne(
      { eventId: parsed.data.eventId },
      { $max: { durationSeconds: parsed.data.durationSeconds } }
    );
    return res.status(202).json({ success: true });
  } catch (error) {
    console.error("TRACK SITE PAGE DURATION ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to record page duration" });
  }
};

const getSiteTraffic = async (req, res) => {
  const days = Number(req.query.days || 7);
  if (![7, 30, 90].includes(days)) {
    return res.status(400).json({ success: false, message: "Traffic range must be 7, 30, or 90 days" });
  }

  try {
    const now = new Date();
    const todayStart = getIndiaDayStart(now);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const start = new Date(todayStart.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    const match = { createdAt: { $gte: start, $lte: now } };
    const [todayRows, activeRows, dailyRows, sourceRows, platformRows, pageRows, recentRows, trackedRows] = await Promise.all([
      SiteAnalytics.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lt: tomorrowStart } } },
        { $group: { _id: null, pageViews: { $sum: 1 }, durationSeconds: { $sum: "$durationSeconds" }, visitors: { $addToSet: "$visitorId" } } },
        { $project: { pageViews: 1, durationSeconds: 1, uniqueVisitors: { $size: "$visitors" } } },
      ]),
      SiteAnalytics.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getTime() - 30 * 60 * 1000), $lte: now } } },
        { $group: { _id: null, visitors: { $addToSet: "$visitorId" } } },
        { $project: { activeVisitors: { $size: "$visitors" } } },
      ]),
      SiteAnalytics.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
            pageViews: { $sum: 1 },
            durationSeconds: { $sum: "$durationSeconds" },
            visitors: { $addToSet: "$visitorId" },
          },
        },
          { $project: { date: "$_id", pageViews: 1, durationSeconds: 1, uniqueVisitors: { $size: "$visitors" } } },
        { $sort: { date: 1 } },
      ]),
      SiteAnalytics.aggregate([
        { $match: match },
        { $group: { _id: "$source", pageViews: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
        { $project: { source: "$_id", pageViews: 1, uniqueVisitors: { $size: "$visitors" } } },
        { $sort: { pageViews: -1, source: 1 } },
        { $limit: 10 },
      ]),
      SiteAnalytics.aggregate([
        { $match: match },
        { $group: { _id: "$platform", pageViews: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
        { $project: { platform: "$_id", pageViews: 1, uniqueVisitors: { $size: "$visitors" } } },
        { $sort: { pageViews: -1, platform: 1 } },
      ]),
      SiteAnalytics.aggregate([
        { $match: match },
        { $group: { _id: "$path", pageViews: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
        { $project: { path: "$_id", pageViews: 1, uniqueVisitors: { $size: "$visitors" } } },
        { $sort: { pageViews: -1, path: 1 } },
        { $limit: 10 },
      ]),
      SiteAnalytics.find(match)
        .sort({ createdAt: -1 })
        .select("path source platform device createdAt")
        .limit(12)
        .lean(),
      SiteAnalytics.aggregate([
        { $group: { _id: null, pageViews: { $sum: 1 } } },
        { $project: { pageViews: 1 } },
      ]),
    ]);

    const dailyByDate = new Map(dailyRows.map((row) => [row.date, row]));
    const daily = [];
    for (let offset = 0; offset < days; offset += 1) {
      const day = new Date(start.getTime() + offset * 24 * 60 * 60 * 1000);
      const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(day);
      daily.push(dailyByDate.get(date) || { date, pageViews: 0, uniqueVisitors: 0, durationSeconds: 0 });
    }

    return res.status(200).json({
      success: true,
      traffic: {
        days,
        summary: {
          ...(todayRows[0] || { pageViews: 0, uniqueVisitors: 0, durationSeconds: 0 }),
          activeVisitors: activeRows[0]?.activeVisitors || 0,
        },
        tracked: trackedRows[0] || { pageViews: 0, uniqueVisitors: 0, durationSeconds: 0 },
        daily,
        sources: sourceRows,
        platforms: platformRows,
        topPages: pageRows,
        recent: recentRows,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error("ADMIN SITE TRAFFIC ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load site traffic" });
  }
};

module.exports = { trackPageView, trackPageDuration, getSiteTraffic };
