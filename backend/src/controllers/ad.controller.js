const mongoose = require("mongoose");
const { z } = require("zod");
const Ad = require("../models/ad.model");

const httpsUrl = z.string().url().refine((value) => value.startsWith("https://"), {
  message: "URL must use HTTPS",
});
const optionalDate = z.preprocess(
  (value) => value === "" || value == null ? undefined : value,
  z.coerce.date().optional()
);
const adSchema = z.object({
  slot: z.enum(["top", "bottom"]),
  targetBy: z.enum(["all", "cafe", "location"]).default("cafe"),
  cafe: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  location: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  text: z.string().trim().min(1).max(120),
  logoUrl: httpsUrl.optional(),
  imageUrl: httpsUrl.optional(),
  linkUrl: httpsUrl,
  active: z.boolean().default(true),
  startsAt: optionalDate,
  endsAt: optionalDate,
}).superRefine((ad, context) => {
  if (ad.targetBy === "cafe" && !ad.cafe) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "A cafe slug is required for cafe targeting", path: ["cafe"] });
  }
  if (ad.targetBy === "location" && !ad.location) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "A location slug is required for location targeting", path: ["location"] });
  }
  if (ad.slot === "top" && !ad.logoUrl) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "A logo URL is required for top ads", path: ["logoUrl"] });
  }
  if (ad.slot === "bottom" && !ad.imageUrl) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "An image URL is required for bottom ads", path: ["imageUrl"] });
  }
  if (ad.startsAt && ad.endsAt && ad.endsAt <= ad.startsAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "End date must be after start date", path: ["endsAt"] });
  }
});
const toggleSchema = z.object({ active: z.boolean() });

const parseOrRespond = (schema, input, res) => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: parsed.error.issues[0]?.message || "Invalid ad details",
    });
    return null;
  }
  return parsed.data;
};

const getPublicAds = async (req, res) => {
  res.set("Cache-Control", "public, max-age=60, s-maxage=300");
  const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  const cafe = req.query.cafe === undefined ? null : slugSchema.safeParse(req.query.cafe);
  const location = req.query.location === undefined ? null : slugSchema.safeParse(req.query.location);
  if ((cafe && !cafe.success) || (location && !location.success) || (!cafe && !location)) {
    return res.status(400).json({ success: false, message: "A valid cafe or location slug is required" });
  }

  try {
    const now = new Date();
    const cafeSlugs = cafe?.success && cafe.data === "htl-cafe"
      ? ["htl-cafe", "htlcafe"]
      : cafe?.success
          ? [cafe.data]
          : [];
    const targetMatches = [
      { targetBy: "all", cafe: "all" },
      ...(cafe ? [
          { targetBy: "cafe", cafe: { $in: cafeSlugs } },
          { targetBy: { $exists: false }, cafe: { $in: [...cafeSlugs, "all"] } },
      ] : []),
      ...(location ? [{ targetBy: "location", location: location.data }] : []),
    ];
    const ads = await Ad.find({
      slot: { $in: ["top", "bottom"] },
      active: true,
      $and: [
        { $or: targetMatches },
        { $or: [{ startsAt: { $lte: now } }, { startsAt: { $exists: false } }, { startsAt: null }] },
        { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
      ],
    })
      .select("slot targetBy cafe location text logoUrl imageUrl linkUrl createdAt")
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    const selected = { top: [], bottom: [] };
    const priorities = { top: 0, bottom: 0 };
    for (const ad of ads) {
      const priority = ad.targetBy === "cafe" || (!ad.targetBy && ad.cafe !== "all")
        ? 3
        : ad.targetBy === "location"
          ? 2
          : 1;
      if (priority < priorities[ad.slot]) continue;
      if (priority > priorities[ad.slot]) {
        priorities[ad.slot] = priority;
        selected[ad.slot] = [];
      }
      if (selected[ad.slot].length < 10) {
        selected[ad.slot].push(ad.slot === "top"
          ? { id: ad._id, logo: ad.logoUrl, text: ad.text, url: ad.linkUrl }
          : { id: ad._id, image: ad.imageUrl, text: ad.text, url: ad.linkUrl });
      }
    }
    return res.status(200).json(selected);
  } catch (error) {
    console.error("GET PUBLIC ADS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch ads" });
  }
};

const listAds = async (_req, res) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, ads });
  } catch (error) {
    console.error("LIST ADS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch ads" });
  }
};

const createAd = async (req, res) => {
  const fields = parseOrRespond(adSchema, req.body, res);
  if (!fields) return;
  try {
    const ad = await Ad.create(fields);
    return res.status(201).json({ success: true, ad });
  } catch (error) {
    console.error("CREATE AD ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to create ad" });
  }
};

const updateAd = async (req, res) => {
  const fields = parseOrRespond(adSchema, req.body, res);
  if (!fields) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid ad ID" });
  }
  try {
    const ad = await Ad.findByIdAndUpdate(req.params.id, {
      $set: {
        ...fields,
        cafe: fields.targetBy === "cafe" ? fields.cafe : "all",
        location: fields.targetBy === "location" ? fields.location : "",
      },
      $unset: { [fields.slot === "top" ? "imageUrl" : "logoUrl"]: 1 },
    }, {
      new: true,
      runValidators: true,
    });
    if (!ad) return res.status(404).json({ success: false, message: "Ad not found" });
    return res.status(200).json({ success: true, ad });
  } catch (error) {
    console.error("UPDATE AD ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update ad" });
  }
};

const toggleAd = async (req, res) => {
  const fields = parseOrRespond(toggleSchema, req.body, res);
  if (!fields) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid ad ID" });
  }
  try {
    const ad = await Ad.findByIdAndUpdate(req.params.id, fields, {
      new: true,
      runValidators: true,
    });
    if (!ad) return res.status(404).json({ success: false, message: "Ad not found" });
    return res.status(200).json({ success: true, ad });
  } catch (error) {
    console.error("TOGGLE AD ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update ad status" });
  }
};

const deleteAd = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid ad ID" });
  }
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);
    if (!ad) return res.status(404).json({ success: false, message: "Ad not found" });
    return res.status(200).json({ success: true, message: "Ad deleted" });
  } catch (error) {
    console.error("DELETE AD ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to delete ad" });
  }
};

module.exports = { getPublicAds, listAds, createAd, updateAd, toggleAd, deleteAd };
