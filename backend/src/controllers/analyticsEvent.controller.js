const mongoose = require("mongoose");
const { z } = require("zod");
const AnalyticsEvent = require("../models/analyticsEvent.model");
const Ad = require("../models/ad.model");
const Owner = require("../models/Owner");
const Room = require("../models/room.model");
const HourlyRoom = require("../models/HourlyRoom.model");
const Villa = require("../models/Villa");
const Mess = require("../models/Mess");
const Vehicle = require("../models/vehicle.model");

const eventTypes = [
  "listing_view", "call_click", "whatsapp_click", "contact_request", "wishlist_add",
  "share", "owner_profile_view", "search", "ad_impression", "ad_click",
];
const schema = z.object({
  type: z.enum(eventTypes),
  listingType: z.enum(["room", "pg", "hostel", "flat", "villa", "mess", "vehicle", "hourly", "other"]).optional(),
  listingId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  visitorId: z.string().regex(/^[a-zA-Z0-9-]{16,80}$/),
  adId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  source: z.enum(["home", "search", "map", "listing", "profile", "ad"]).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const getDevice = (agent = "") => {
  if (/ipad|tablet|playbook|silk/i.test(agent)) return "tablet";
  if (/mobile|iphone|ipod|android/i.test(agent)) return "mobile";
  return "desktop";
};

const lookupListingOwner = async (listingType, listingId) => {
  if (!listingId) return null;
  const models = {
    room: Room,
    pg: Room,
    hostel: Room,
    flat: Room,
    hourly: HourlyRoom,
    villa: Villa,
    mess: Mess,
    vehicle: Vehicle,
  };
  const model = models[listingType];
  if (!model) return null;
  const listing = await model.findById(listingId)
    .select(listingType === "hourly" ? "requestedByOwner" : "owner")
    .lean();
  return listing?.owner || listing?.requestedByOwner || null;
};

const writeEvent = async ({ event, user, device, listingOwner }) => {
  const dedupedTypes = ["listing_view", "owner_profile_view", "ad_impression"];
  const clickTypes = ["call_click", "whatsapp_click", "contact_request", "ad_click"];
  const windowMs = dedupedTypes.includes(event.type) ? 30 * 60 * 1000 : 5 * 1000;
  if (dedupedTypes.includes(event.type) || clickTypes.includes(event.type)) {
    const since = new Date(Date.now() - windowMs);
    const filter = {
      visitorId: event.visitorId,
      type: event.type,
      createdAt: { $gte: since },
    };
    if (event.type === "owner_profile_view" && listingOwner) {
      filter.owner = listingOwner;
      filter.listingId = null;
    } else if (event.listingId) filter.listingId = event.listingId;
    else filter.listingId = null;
    if (event.adId) filter.adId = event.adId;
    if (await AnalyticsEvent.exists(filter)) return;
  }
  await AnalyticsEvent.create({
    ...event,
    listingId: event.listingId || null,
    adId: event.adId || null,
    owner: listingOwner || null,
    user: ["user", "admin"].includes(user?.role) ? user._id : null,
    device,
    meta: event.meta || {},
  });
};

const trackEvent = async (req, res) => {
  const agent = req.get("user-agent") || "";
  if (/bot|crawler|spider|slurp|headless|googlebot|bingbot/i.test(agent)) {
    return res.status(204).end();
  }
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(204).end();
  const event = parsed.data;
  const listingType = event.listingType || "other";
  if ((event.type === "ad_click" || event.type === "ad_impression") && !event.adId) {
    return res.status(204).end();
  }
  const listingId = event.listingId
    ? new mongoose.Types.ObjectId(event.listingId)
    : null;
  const adId = event.adId ? new mongoose.Types.ObjectId(event.adId) : null;
  const cleanEvent = {
    ...event,
    listingType,
    listingId,
    adId,
    source: event.source || "listing",
  };
  const rawOwnerId = event.type === "owner_profile_view" ? event.meta?.ownerId : null;
  res.status(204).end();
  Promise.all([
    listingId ? lookupListingOwner(listingType, listingId) : null,
    rawOwnerId && mongoose.isValidObjectId(rawOwnerId) ? Owner.findById(rawOwnerId).select("_id").lean() : null,
    adId ? Ad.exists({ _id: adId }) : null,
  ]).then(async ([listingOwner, profileOwner, adExists]) => {
    if (adId && !adExists) return;
    await writeEvent({
      event: cleanEvent,
      user: req.user,
      device: getDevice(agent),
      listingOwner: listingOwner || profileOwner?._id || null,
    });
  }).catch(() => {});
};

const getRange = (value) => {
  const days = Number(value || 7);
  if (![7, 30, 90].includes(days)) return null;
  const end = new Date();
  return { days, end, start: new Date(end.getTime() - days * 86400000) };
};
const dateGroup = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } };
const countTypes = (types) => Object.fromEntries(types.map((type) => [type, { $sum: { $cond: [{ $eq: ["$type", type] }, 1, 0] } }]));

const getOwnerAnalytics = async (req, res) => {
  const range = getRange(req.query.range);
  if (!range) return res.status(400).json({ success: false, message: "Range must be 7d, 30d, or 90d" });
  const owner = req.user?._id;
  try {
    const match = { owner: new mongoose.Types.ObjectId(owner), createdAt: { $gte: range.start, $lte: range.end } };
    const contactTypes = ["contact_request"];
    const [totalsRows, daily, rooms, contacts] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: null, ...countTypes(["listing_view", "call_click", "whatsapp_click", "contact_request", "wishlist_add"]), visitors: { $addToSet: "$visitorId" } } },
        { $project: { _id: 0, views: "$listing_view", calls: "$call_click", whatsapp: "$whatsapp_click", contacts: "$contact_request", wishlistAdds: "$wishlist_add", uniqueVisitors: { $size: "$visitors" } } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: dateGroup, ...countTypes(["listing_view", ...contactTypes]) } },
        { $project: { _id: 0, date: "$_id", views: "$listing_view", contacts: "$contact_request" } },
        { $sort: { date: 1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...match, listingId: { $ne: null }, listingType: { $in: ["room", "pg", "hostel", "flat"] }, type: { $in: ["listing_view", "contact_request"] } } },
        { $group: { _id: "$listingId", ...countTypes(["listing_view", "contact_request"]) } },
        { $lookup: { from: "rooms", localField: "_id", foreignField: "_id", as: "room" } },
        { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, id: "$_id", title: { $ifNull: ["$room.title", "$room.name"] }, listingType: "$room.category", views: "$listing_view", contacts: "$contact_request", conversion: { $cond: [{ $gt: ["$listing_view", 0] }, { $multiply: [{ $divide: ["$contact_request", "$listing_view"] }, 100] }, 0] } } },
        { $sort: { views: -1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...match, type: { $in: ["contact_request", "call_click", "whatsapp_click"] } } },
        { $sort: { createdAt: -1 } },
        { $limit: 50 },
        { $lookup: { from: "rooms", localField: "listingId", foreignField: "_id", as: "room" } },
        { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "contactUser" } },
        { $unwind: { path: "$contactUser", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, createdAt: 1, actionType: "$type", room: { $ifNull: ["$room.title", "$room.name"] }, userName: { $ifNull: ["$contactUser.name", "Anonymous visitor"] }, userPhone: { $ifNull: ["$contactUser.phone", ""] } } },
      ]),
    ]);
    const totals = totalsRows[0] || { views: 0, calls: 0, whatsapp: 0, contacts: 0, wishlistAdds: 0, uniqueVisitors: 0 };
    return res.json({
      success: true,
      analytics: {
        range: `${range.days}d`,
        totals: { ...totals, conversion: totals.uniqueVisitors ? totals.contacts / totals.uniqueVisitors * 100 : 0 },
        daily,
        rooms,
        contacts,
      },
    });
  } catch (error) {
    console.error("OWNER EVENT ANALYTICS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load owner analytics" });
  }
};

const getAdminAnalytics = async (req, res) => {
  const range = getRange(req.query.range);
  if (!range) return res.status(400).json({ success: false, message: "Range must be 7d, 30d, or 90d" });
  const match = { createdAt: { $gte: range.start, $lte: range.end } };
  try {
    const [totalsRows, daily, topRooms, owners, sources, devices, ads] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: null, ...countTypes(["listing_view", "contact_request"]), visitors: { $addToSet: "$visitorId" } } },
        { $project: { _id: 0, views: "$listing_view", contacts: "$contact_request", uniqueVisitors: { $size: "$visitors" } } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: dateGroup, ...countTypes(["listing_view", "contact_request"]) } },
        { $project: { _id: 0, date: "$_id", views: "$listing_view", contacts: "$contact_request" } },
        { $sort: { date: 1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...match, type: { $in: ["listing_view", "contact_request"] }, listingId: { $ne: null }, listingType: { $in: ["room", "pg", "hostel", "flat"] } } },
        { $group: { _id: "$listingId", ...countTypes(["listing_view", "contact_request"]) } },
        { $sort: { listing_view: -1 } }, { $limit: 10 },
        { $lookup: { from: "rooms", localField: "_id", foreignField: "_id", as: "room" } },
        { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, id: "$_id", title: "$room.title", views: "$listing_view", contacts: "$contact_request" } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...match, owner: { $ne: null }, type: { $in: ["listing_view", "contact_request"] }, listingType: { $in: ["room", "pg", "hostel", "flat", "hourly"] } } },
        { $group: { _id: "$owner", ...countTypes(["listing_view", "contact_request"]) } },
        { $lookup: { from: "owners", localField: "_id", foreignField: "_id", as: "owner" } },
        { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, ownerId: "$_id", name: "$owner.name", views: "$listing_view", contacts: "$contact_request", conversion: { $cond: [{ $gt: ["$listing_view", 0] }, { $multiply: [{ $divide: ["$contact_request", "$listing_view"] }, 100] }, 0] } } },
        { $sort: { views: -1 } }, { $limit: 20 },
      ]),
      AnalyticsEvent.aggregate([
        { $match: match }, { $group: { _id: "$source", count: { $sum: 1 } } },
        { $project: { _id: 0, source: "$_id", count: 1 } }, { $sort: { count: -1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: match }, { $group: { _id: "$device", count: { $sum: 1 } } },
        { $project: { _id: 0, device: "$_id", count: 1 } }, { $sort: { count: -1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...match, adId: { $ne: null }, type: { $in: ["ad_impression", "ad_click"] } } },
        { $group: { _id: { ad: "$adId", day: dateGroup }, impressions: { $sum: { $cond: [{ $eq: ["$type", "ad_impression"] }, 1, 0] } }, clicks: { $sum: { $cond: [{ $eq: ["$type", "ad_click"] }, 1, 0] } }, visitors: { $addToSet: "$visitorId" } } },
        { $group: { _id: "$_id.ad", impressions: { $sum: "$impressions" }, clicks: { $sum: "$clicks" }, visitors: { $addToSet: "$visitors" }, byDay: { $push: { date: "$_id.day", impressions: "$impressions", clicks: "$clicks" } } } },
        { $lookup: { from: "ads", localField: "_id", foreignField: "_id", as: "ad" } },
        { $unwind: { path: "$ad", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, adId: "$_id", text: "$ad.text", impressions: 1, clicks: 1, ctr: { $cond: [{ $gt: ["$impressions", 0] }, { $multiply: [{ $divide: ["$clicks", "$impressions"] }, 100] }, 0] }, uniqueVisitors: { $size: { $reduce: { input: "$visitors", initialValue: [], in: { $setUnion: ["$$value", "$$this"] } } } }, byDay: 1 } },
        { $sort: { impressions: -1 } },
      ]),
    ]);
    const totals = totalsRows[0] || { views: 0, contacts: 0, uniqueVisitors: 0 };
    return res.json({
      success: true,
      analytics: {
        range: `${range.days}d`,
        totals: { ...totals, conversion: totals.uniqueVisitors ? totals.contacts / totals.uniqueVisitors * 100 : 0 },
        funnel: [{ action: "Views", count: totals.views }, { action: "Contacts", count: totals.contacts }],
        daily,
        topRooms,
        owners,
        sources,
        devices,
        ads,
      },
    });
  } catch (error) {
    console.error("ADMIN EVENT ANALYTICS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load admin analytics" });
  }
};

module.exports = { trackEvent, getOwnerAnalytics, getAdminAnalytics, writeEvent, getDevice };
