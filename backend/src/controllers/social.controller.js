const mongoose = require("mongoose");
const SocialPlace = require("../models/SocialPlace");
const SocialSuggestion = require("../models/SocialSuggestion");
const { createUniqueSlug } = require("../utils/publicSlug");

const CATEGORIES = ["free-food", "blood", "shelter", "medical", "helpline", "scholarship", "volunteer"];
const SUBTYPES = {
  blood: ["blood-bank", "donation-camp"],
  medical: ["government-hospital", "dispensary", "health-camp"],
  helpline: ["ambulance", "police", "women", "child", "mental-health", "other"],
};
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const cleanText = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
const parseObject = (value, fallback = {}) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};
const boolValue = (value) => value === true || value === "true";
const isValidTime = (value) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeSchedule = (value) => {
  const rows = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(rows)) throw new Error("Schedule must be a list");
  return rows.map((row) => {
    const days = Array.isArray(row.days) ? row.days.filter((day) => day === "Daily" || DAYS.includes(day)) : [];
    const startTime = cleanText(row.startTime, 5);
    const endTime = cleanText(row.endTime, 5);
    if (!isValidTime(startTime) || !isValidTime(endTime)) throw new Error("Use 24-hour time such as 09:30");
    return { days, startTime, endTime, details: cleanText(row.details, 300) };
  });
};

const normalizedExtra = (category, value) => {
  const input = parseObject(value);
  if (category === "free-food") {
    return {
      foodType: cleanText(input.foodType, 100),
      itemsServed: Array.isArray(input.itemsServed) ? input.itemsServed.map((item) => cleanText(item, 100)).filter(Boolean).slice(0, 30) : [],
    };
  }
  if (category === "scholarship") {
    return {
      eligibility: cleanText(input.eligibility, 800),
      lastDate: input.lastDate && !Number.isNaN(new Date(input.lastDate).getTime()) ? new Date(input.lastDate) : null,
      link: /^https?:\/\//i.test(String(input.link || "")) ? cleanText(input.link, 500) : "",
    };
  }
  return {};
};

const formData = (body, { draft = false } = {}) => {
  const category = cleanText(body.category, 30);
  const subType = cleanText(body.subType, 40);
  if (!CATEGORIES.includes(category)) throw new Error("Choose a valid social work category");
  if (SUBTYPES[category] && subType && !SUBTYPES[category].includes(subType)) throw new Error("Choose a valid category type");
  const address = cleanText(body.address, 400);
  const area = cleanText(body.area, 100);
  const name = cleanText(body.name, 150);
  if (!name || !area || !address) throw new Error("Name, area, and address are required");
  const lng = body.lng === "" || body.lng === undefined ? null : Number(body.lng);
  const lat = body.lat === "" || body.lat === undefined ? null : Number(body.lat);
  if ((lng === null) !== (lat === null) || (lng !== null && (
    !Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90
  ))) throw new Error("Enter valid map coordinates");
  const eventDate = body.eventDate ? new Date(body.eventDate) : null;
  const eventEndDate = body.eventEndDate ? new Date(body.eventEndDate) : null;
  if ((eventDate && Number.isNaN(eventDate.getTime())) || (eventEndDate && Number.isNaN(eventEndDate.getTime()))) {
    throw new Error("Enter valid event dates");
  }
  const schedule = body.schedule === undefined ? [] : normalizeSchedule(body.schedule);
  return {
    category,
    subType,
    name,
    area,
    address,
    location: lng === null ? undefined : { type: "Point", coordinates: [lng, lat] },
    mapLink: /^https?:\/\//i.test(String(body.mapLink || ""))
      ? cleanText(body.mapLink, 500)
      : lng === null ? "" : `https://www.google.com/maps?q=${lat},${lng}`,
    organizer: cleanText(body.organizer, 150),
    description: cleanText(body.description, 2000),
    contactNumber: cleanText(body.contactNumber, 40),
    alternateNumber: cleanText(body.alternateNumber, 40),
    isOpen24x7: boolValue(body.isOpen24x7),
    schedule,
    eventDate,
    eventEndDate,
    whoCanCome: cleanText(body.whoCanCome, 500),
    notes: cleanText(body.notes, 1000),
    extra: normalizedExtra(category, body.extra),
    isVerified: draft ? false : boolValue(body.isVerified),
    lastVerifiedAt: draft ? null : body.lastVerifiedAt ? new Date(body.lastVerifiedAt) : boolValue(body.isVerified) ? new Date() : null,
    isActive: draft ? false : body.isActive === undefined ? true : boolValue(body.isActive),
  };
};

const placeStatus = (place, now = new Date()) => {
  const localDay = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" }).format(now);
  const previousDay = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" })
    .format(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const currentTime = now.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });
  const schedule = place.schedule || [];
  const appliesOn = (row, day) => (row.days || []).includes("Daily") || (row.days || []).includes(day);
  const activeSchedule = schedule.filter((row) => appliesOn(row, localDay));
  const open = Boolean(place.isOpen24x7 ||
    activeSchedule.some((row) => row.startTime && row.endTime && (
      row.startTime <= row.endTime
        ? row.startTime <= currentTime && currentTime < row.endTime
        : currentTime >= row.startTime
    )) ||
    schedule.some((row) => appliesOn(row, previousDay) && row.startTime > row.endTime && currentTime < row.endTime)
  );
  const nextOpening = activeSchedule.map((row) => row.startTime).filter((time) => time && time > currentTime).sort()[0] || "";
  return { openNow: open, todayHours: activeSchedule, nextOpening };
};

const publicPlace = (place) => {
  const value = place.toObject ? place.toObject() : place;
  return { ...value, ...placeStatus(value) };
};

exports.listPlaces = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (CATEGORIES.includes(req.query.category)) filter.category = req.query.category;
    if (req.query.subType) filter.subType = cleanText(req.query.subType, 40);
    if (req.query.area) filter.area = new RegExp(escapeRegex(cleanText(req.query.area, 100)), "i");
    if (req.query.search) {
      const term = new RegExp(escapeRegex(cleanText(req.query.search, 100)), "i");
      filter.$or = [{ name: term }, { area: term }, { description: term }, { address: term }];
    }
    if (req.query.near !== undefined || req.query.lat !== undefined || req.query.lng !== undefined) {
      const lat = Number(req.query.lat);
      const lng = Number(req.query.lng);
      const maxDistance = Math.min(100000, Math.max(1000, Number(req.query.maxDistance) || 25000));
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return res.status(400).json({ success: false, message: "Enter valid coordinates to search nearby" });
      }
      filter.location = { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: maxDistance } };
    }
    let places = await SocialPlace.find(filter).limit(300).lean();
    const now = new Date();
    const localToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
    const eventLocalDate = (date) => date ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date) : "";
    if (req.query.upcoming === "true") places = places.filter((place) =>
      place.eventDate && eventLocalDate(place.eventEndDate || place.eventDate) >= localToday
    );
    if (req.query.today === "true") {
      const today = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" }).format(now);
      places = places.filter((place) => {
        const eventStart = eventLocalDate(place.eventDate);
        const eventEnd = eventLocalDate(place.eventEndDate || place.eventDate);
        const dateToday = eventStart && eventStart <= localToday && eventEnd >= localToday;
        return dateToday || (place.schedule || []).some((row) => (row.days || []).includes("Daily") || (row.days || []).includes(today));
      });
    }
    places = places.map(publicPlace);
    if (req.query.openNow === "true") places = places.filter((place) => place.openNow);
    if (req.query.near !== undefined || req.query.lat !== undefined) {
      const { lat, lng } = req.query;
      const toRadians = (degrees) => degrees * Math.PI / 180;
      const distance = (place) => {
        if (!place.location?.coordinates) return Number.POSITIVE_INFINITY;
        const [placeLng, placeLat] = place.location.coordinates;
        const dLat = toRadians(placeLat - Number(lat));
        const dLng = toRadians(placeLng - Number(lng));
        const arc = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(Number(lat))) * Math.cos(toRadians(placeLat)) * Math.sin(dLng / 2) ** 2;
        return 6371000 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
      };
      places.sort((a, b) => distance(a) - distance(b));
    } else {
      places.sort((a, b) => new Date(a.eventDate || a.createdAt) - new Date(b.eventDate || b.createdAt));
    }
    res.json({ success: true, places });
  } catch (error) {
    console.error("SOCIAL PLACE LIST ERROR:", error);
    res.status(500).json({ success: false, message: "Social work listings could not be loaded" });
  }
};

exports.listAllPlaces = async (_req, res) => {
  try {
    const places = await SocialPlace.find().sort({ category: 1, name: 1 }).lean();
    res.json({ success: true, places });
  } catch {
    res.status(500).json({ success: false, message: "Social work listings could not be loaded" });
  }
};

exports.getPlace = async (req, res) => {
  try {
    const query = mongoose.isValidObjectId(req.params.slug)
      ? { $or: [{ slug: req.params.slug }, { _id: req.params.slug }] }
      : { slug: req.params.slug.toLowerCase() };
    const place = await SocialPlace.findOne({ ...query, isActive: true }).lean();
    if (!place) return res.status(404).json({ success: false, message: "Social work listing not found" });
    res.json({ success: true, place: publicPlace(place) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Social work listing could not be loaded" });
  }
};

exports.getAdminPlace = async (req, res) => {
  try {
    const place = await SocialPlace.findById(req.params.id).lean();
    if (!place) return res.status(404).json({ success: false, message: "Social work listing not found" });
    res.json({ success: true, place });
  } catch {
    res.status(404).json({ success: false, message: "Social work listing not found" });
  }
};

exports.createPlace = async (req, res) => {
  try {
    const data = formData(req.body);
    data.slug = await createUniqueSlug(SocialPlace, data.name);
    const place = await SocialPlace.create(data);
    res.status(201).json({ success: true, place });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Social work listing could not be created" });
  }
};

exports.updatePlace = async (req, res) => {
  try {
    const place = await SocialPlace.findById(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: "Social work listing not found" });
    const current = place.toObject();
    const existingCoordinates = current.location?.coordinates;
    const mergedBody = {
      ...current,
      ...req.body,
      schedule: req.body.schedule === undefined ? current.schedule : req.body.schedule,
      lng: req.body.lng === undefined ? existingCoordinates?.[0] : req.body.lng,
      lat: req.body.lat === undefined ? existingCoordinates?.[1] : req.body.lat,
      extra: req.body.extra === undefined ? current.extra : req.body.extra,
    };
    const data = formData(mergedBody);
    if (req.body.name && req.body.name !== place.name) data.slug = await createUniqueSlug(SocialPlace, data.name, place._id);
    Object.assign(place, data);
    if (req.body.isVerified !== undefined && boolValue(req.body.isVerified) && !req.body.lastVerifiedAt) place.lastVerifiedAt = new Date();
    await place.save();
    res.json({ success: true, place });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Social work listing could not be updated" });
  }
};

exports.deletePlace = async (req, res) => {
  try {
    const place = await SocialPlace.findByIdAndDelete(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: "Social work listing not found" });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: "Social work listing could not be deleted" });
  }
};

exports.suggestPlace = async (req, res) => {
  try {
    const { category, subType, name, area, address, contactNumber, description } = req.body || {};
    if (!CATEGORIES.includes(category) || !cleanText(name, 150) || !cleanText(area, 100) || !cleanText(address, 400)) {
      return res.status(400).json({ success: false, message: "Category, name, area, and address are required" });
    }
    if (SUBTYPES[category] && subType && !SUBTYPES[category].includes(subType)) {
      return res.status(400).json({ success: false, message: "Choose a valid category type" });
    }
    const suggestion = await SocialSuggestion.create({
      suggestedBy: req.user._id,
      category,
      subType: cleanText(subType, 40),
      name: cleanText(name, 150),
      area: cleanText(area, 100),
      address: cleanText(address, 400),
      contactNumber: cleanText(contactNumber, 40),
      description: cleanText(description, 1000),
    });
    res.status(201).json({ success: true, suggestionId: suggestion._id });
  } catch (error) {
    res.status(500).json({ success: false, message: "Suggestion could not be submitted" });
  }
};

exports.listSuggestions = async (_req, res) => {
  try {
    const suggestions = await SocialSuggestion.find().populate("suggestedBy", "name").sort({ createdAt: -1 }).limit(500).lean();
    res.json({ success: true, suggestions });
  } catch {
    res.status(500).json({ success: false, message: "Suggestions could not be loaded" });
  }
};

exports.reviewSuggestion = async (req, res) => {
  try {
    if (!["approve", "reject"].includes(req.params.action)) return res.status(400).json({ success: false, message: "Invalid review action" });
    const suggestion = await SocialSuggestion.findById(req.params.id);
    if (!suggestion) return res.status(404).json({ success: false, message: "Suggestion not found" });
    if (suggestion.status !== "pending") return res.status(409).json({ success: false, message: "Suggestion has already been reviewed" });
    if (req.params.action === "approve") {
      const placeData = {
        category: suggestion.category,
        subType: suggestion.subType,
        name: suggestion.name,
        slug: await createUniqueSlug(SocialPlace, suggestion.name),
        area: suggestion.area,
        address: suggestion.address,
        contactNumber: suggestion.contactNumber,
        description: suggestion.description,
        isVerified: false,
        isActive: false,
      };
      await SocialPlace.create(placeData);
      suggestion.status = "approved";
    } else {
      suggestion.status = "rejected";
    }
    suggestion.reviewedBy = req.user._id;
    suggestion.reviewedAt = new Date();
    await suggestion.save();
    res.json({ success: true, suggestion });
  } catch (error) {
    console.error("SOCIAL SUGGESTION REVIEW ERROR:", error);
    res.status(500).json({ success: false, message: "Suggestion could not be reviewed" });
  }
};
