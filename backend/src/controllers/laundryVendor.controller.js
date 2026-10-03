const mongoose = require("mongoose");
const LaundryVendor = require("../models/laundryVendor.model");
const { createUniqueSlug, ensurePublicSlugs } = require("../utils/publicSlug");

const cleanCatalog = (input) => {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item) => item && typeof item.name === "string")
    .map((item) => ({
      name: item.name.trim().slice(0, 80),
      price: Number(item.price),
    }))
    .filter((item) => item.name && Number.isFinite(item.price) && item.price >= 0);
};

const vendorFields = (body) => {
  const fields = {
    vendorName: typeof body.vendorName === "string" ? body.vendorName.trim() : "",
    phone: typeof body.phone === "string" ? body.phone.trim() : "",
    whatsapp: typeof body.whatsapp === "string" ? body.whatsapp.trim() : "",
    area: typeof body.area === "string" ? body.area.trim() : "",
    address: typeof body.address === "string" ? body.address.trim() : "",
    catalog: cleanCatalog(body.catalog),
    isActive: body.isActive !== false,
  };

  const lat = Number(body.latitude);
  const lng = Number(body.longitude);
  if (
    body.latitude === "" ||
    body.latitude == null ||
    body.longitude === "" ||
    body.longitude == null ||
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180
  ) {
    throw new Error("Valid vendor latitude and longitude are required for nearby listings");
  }
  fields.location = { type: "Point", coordinates: [lng, lat] };
  return fields;
};

const createVendor = async (req, res) => {
  try {
    const fields = vendorFields(req.body || {});
    if (!fields.vendorName || !fields.phone || !fields.address || !fields.catalog.length) {
      return res.status(400).json({
        success: false,
        message: "Vendor name, phone, address, and at least one priced clothing item are required",
      });
    }
    if (!fields.whatsapp) fields.whatsapp = fields.phone;

    fields.slug = await createUniqueSlug(LaundryVendor, fields.vendorName);
    const vendor = await LaundryVendor.create(fields);
    res.status(201).json({ success: true, vendor });
  } catch (error) {
    console.error("CREATE LAUNDRY VENDOR ERROR:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to add vendor" });
  }
};

const getAllVendors = async (_req, res) => {
  try {
    const vendors = await LaundryVendor.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, vendors });
  } catch (error) {
    console.error("GET LAUNDRY VENDORS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch vendors" });
  }
};

const updateVendor = async (req, res) => {
  try {
    const fields = vendorFields(req.body || {});
    if (!fields.vendorName || !fields.phone || !fields.address || !fields.catalog.length) {
      return res.status(400).json({
        success: false,
        message: "Vendor name, phone, address, and at least one priced clothing item are required",
      });
    }
    if (!fields.whatsapp) fields.whatsapp = fields.phone;

    const current = await LaundryVendor.findById(req.params.id);
    if (!current) return res.status(404).json({ success: false, message: "Vendor not found" });
    if (fields.vendorName !== current.vendorName) {
      fields.slug = await createUniqueSlug(LaundryVendor, fields.vendorName, current._id);
    }
    const vendor = await LaundryVendor.findByIdAndUpdate(req.params.id, fields, {
      new: true,
      runValidators: true,
    });
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
    res.status(200).json({ success: true, vendor });
  } catch (error) {
    console.error("UPDATE LAUNDRY VENDOR ERROR:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to update vendor" });
  }
};

const deleteVendor = async (req, res) => {
  try {
    const vendor = await LaundryVendor.findByIdAndDelete(req.params.id);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
    res.status(200).json({ success: true, message: "Vendor deleted" });
  } catch (error) {
    console.error("DELETE LAUNDRY VENDOR ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to delete vendor" });
  }
};

const getPublicVendors = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    let vendors;
    if (lat !== undefined && lng !== undefined) {
      const latitude = Number(lat);
      const longitude = Number(lng);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return res.status(400).json({ success: false, message: "Invalid coordinates" });
      }
      vendors = await LaundryVendor.find({
        isActive: true,
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [longitude, latitude] },
          },
        },
      }).lean();
    } else {
      vendors = await LaundryVendor.find({ isActive: true })
        .sort({ area: 1, vendorName: 1 })
        .lean();
    }
    await ensurePublicSlugs(LaundryVendor, vendors, (vendor) => vendor.vendorName);
    res.status(200).json({ success: true, vendors });
  } catch (error) {
    console.error("GET PUBLIC LAUNDRY VENDORS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch laundry vendors" });
  }
};

const getPublicVendor = async (req, res) => {
  try {
    const identity = mongoose.isValidObjectId(req.params.id)
      ? { _id: req.params.id }
      : { slug: req.params.id.toLowerCase() };
    const vendor = await LaundryVendor.findOne({
      ...identity,
      isActive: true,
    }).lean();
    if (!vendor) return res.status(404).json({ success: false, message: "Laundry vendor not found" });
    await ensurePublicSlugs(LaundryVendor, [vendor], (item) => item.vendorName);
    res.status(200).json({ success: true, vendor });
  } catch (error) {
    console.error("GET PUBLIC LAUNDRY VENDOR ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch laundry vendor" });
  }
};

module.exports = {
  createVendor,
  getAllVendors,
  updateVendor,
  deleteVendor,
  getPublicVendors,
  getPublicVendor,
};
