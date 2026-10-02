const mongoose = require("mongoose");
const crypto = require("crypto");
const Villa = require("../models/Villa");
const VillaBooking = require("../models/VillaBooking");

const parseArray = (input) => {
  if (Array.isArray(input)) return input;
  if (typeof input !== "string") return [];
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return input.split(",").map((value) => value.trim()).filter(Boolean);
  }
};

const getVillaFields = (body, files, current = {}) => {
  const latitudeValue = body.latitude === "" || body.latitude == null
    ? current.location?.coordinates?.[1]
    : body.latitude;
  const longitudeValue = body.longitude === "" || body.longitude == null
    ? current.location?.coordinates?.[0]
    : body.longitude;
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  if (
    latitudeValue == null ||
    longitudeValue == null ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("Valid villa latitude and longitude are required");
  }
  const fields = {
    name: body.name ?? current.name,
    description: body.description ?? current.description,
    address: body.address ?? current.address,
    area: body.area ?? current.area,
    city: body.city ?? current.city ?? "Indore",
    nightlyRate: Number(body.nightlyRate ?? current.nightlyRate),
    eventRate: Number(body.eventRate ?? current.eventRate),
    maxGuests: Number(body.maxGuests ?? current.maxGuests),
    bedrooms: Number(body.bedrooms ?? current.bedrooms ?? 1),
    bathrooms: Number(body.bathrooms ?? current.bathrooms ?? 1),
    amenities: parseArray(body.amenities ?? current.amenities),
    isActive: body.isActive === undefined ? current.isActive !== false : body.isActive !== "false" && body.isActive !== false,
    location: { type: "Point", coordinates: [longitude, latitude] },
  };
  if (files?.length) fields.images = files.map((file) => file.path);
  else if (current.images) fields.images = current.images;
  return fields;
};

exports.createVilla = async (req, res) => {
  try {
    const villa = await Villa.create(getVillaFields(req.body || {}, req.files));
    res.status(201).json({ success: true, villa });
  } catch (error) {
    console.error("CREATE VILLA ERROR:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to create villa" });
  }
};

exports.getPublicVillas = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const query = { isActive: true };
    if (lat !== undefined || lng !== undefined) {
      const latitude = Number(lat);
      const longitude = Number(lng);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return res.status(400).json({ success: false, message: "Valid latitude and longitude are required" });
      }
      query.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
        },
      };
    }
    const villaQuery = Villa.find(query);
    if (lat === undefined && lng === undefined) villaQuery.sort({ createdAt: -1 });
    const villas = await villaQuery.lean();
    res.status(200).json({ success: true, villas });
  } catch (error) {
    console.error("GET PUBLIC VILLAS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch villas" });
  }
};

exports.getPublicVilla = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid villa id" });
    }
    const villa = await Villa.findOne({ _id: req.params.id, isActive: true }).lean();
    if (!villa) return res.status(404).json({ success: false, message: "Villa not found" });
    res.status(200).json({ success: true, villa });
  } catch (error) {
    console.error("GET PUBLIC VILLA ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch villa" });
  }
};

exports.getAllVillas = async (_req, res) => {
  try {
    const villas = await Villa.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, villas });
  } catch (error) {
    console.error("GET VILLAS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch villas" });
  }
};

exports.updateVilla = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid villa id" });
    }
    const current = await Villa.findById(req.params.id).select("+bookingLockToken +bookingLockUntil");
    if (!current) return res.status(404).json({ success: false, message: "Villa not found" });
    const fields = getVillaFields(req.body || {}, req.files, current);
    const villa = await Villa.findByIdAndUpdate(req.params.id, fields, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, villa });
  } catch (error) {
    console.error("UPDATE VILLA ERROR:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to update villa" });
  }
};

exports.deleteVilla = async (req, res) => {
  const token = crypto.randomUUID();
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid villa id" });
    }
    const now = new Date();
    const villa = await Villa.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { bookingLockUntil: null },
          { bookingLockUntil: { $exists: false } },
          { bookingLockUntil: { $lt: now } },
        ],
      },
      { $set: { bookingLockToken: token, bookingLockUntil: new Date(now.getTime() + 120000) } },
      { new: true }
    );
    if (!villa) {
      return res.status(409).json({ success: false, message: "Villa booking is being processed; try again" });
    }
    const occupied = await VillaBooking.exists({ villa: villa._id });
    if (occupied) {
      return res.status(409).json({ success: false, message: "Villa has reservation history; hide it instead of deleting" });
    }
    const result = await Villa.deleteOne({ _id: villa._id, bookingLockToken: token });
    if (result.deletedCount !== 1) {
      return res.status(409).json({ success: false, message: "Villa booking is being processed; try again" });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("DELETE VILLA ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to delete villa" });
  } finally {
    await Villa.updateOne(
      { _id: req.params.id, bookingLockToken: token },
      { $set: { bookingLockToken: null, bookingLockUntil: null } }
    ).catch((error) => console.error("RELEASE VILLA DELETE LOCK ERROR:", error));
  }
};
