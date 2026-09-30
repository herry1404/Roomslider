const mongoose = require("mongoose");
const Property = require("../models/property.model");
const Room = require("../models/room.model");
require("../models/Owner");

const TYPES = ["Room", "PG", "Hostel", "Flat"];
const safeMsg = (e) =>
  process.env.NODE_ENV === "production" ? "Something went wrong" : e.message;

// Owner: apni properties. Admin: saari (ya ?owner=<id>)
const getMyProperties = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "owner") {
      filter.owner = req.user._id;
    } else if (req.query.owner && mongoose.isValidObjectId(req.query.owner)) {
      filter.owner = req.query.owner;
    }

    const props = await Property.find(filter).sort({ createdAt: -1 }).lean();

    const counts = await Room.aggregate([
      { $match: { property: { $in: props.map((p) => p._id) } } },
      {
        $group: {
          _id: "$property",
          totalRooms: { $sum: 1 },
          vacantRooms: { $sum: { $cond: [{ $eq: ["$status", "vacant"] }, 1, 0] } },
        },
      },
    ]);
    const map = new Map(counts.map((c) => [String(c._id), c]));

    const properties = props.map((p) => ({
      ...p,
      totalRooms: map.get(String(p._id))?.totalRooms || 0,
      vacantRooms: map.get(String(p._id))?.vacantRooms || 0,
    }));

    res.status(200).json({ success: true, properties });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const createProperty = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const area = String(req.body.area || "").trim();
    const propertyType = TYPES.includes(req.body.propertyType)
      ? req.body.propertyType
      : "Room";

    if (!name || !area) {
      return res.status(400).json({
        success: false,
        message: "Property name and area are required",
      });
    }

    let owner = null;
    if (req.user.role === "owner") {
      owner = req.user._id;
    } else if (req.body.owner && mongoose.isValidObjectId(req.body.owner)) {
      owner = req.body.owner;
    }

    const property = await Property.create({ name, area, propertyType, owner });
    res.status(201).json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const updateProperty = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }
    if (
      req.user.role === "owner" &&
      String(property.owner) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own property",
      });
    }

    if (req.body.name !== undefined) {
      const n = String(req.body.name).trim();
      if (!n) {
        return res.status(400).json({ success: false, message: "Name cannot be empty" });
      }
      property.name = n;
    }
    if (req.body.area !== undefined) {
      const a = String(req.body.area).trim();
      if (!a) {
        return res.status(400).json({ success: false, message: "Area cannot be empty" });
      }
      property.area = a;
    }
    if (TYPES.includes(req.body.propertyType)) {
      property.propertyType = req.body.propertyType;
    }

    await property.save();
    res.status(200).json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

// Public: property page ka data (tenant/payment fields nahi jate)
const getPublicProperty = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }
    const property = await Property.findById(req.params.id)
      .populate("owner", "name slug")
      .lean();
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    const rooms = await Room.find({ property: property._id, status: "vacant" })
      .select("-currentTenant -currentTenantUser -occupancyHistory -paymentStatus")
      .sort({ priority: 1, roomNumber: 1 })
      .lean();

    res.status(200).json({ success: true, property, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

module.exports = {
  getMyProperties,
  createProperty,
  updateProperty,
  getPublicProperty,
};
