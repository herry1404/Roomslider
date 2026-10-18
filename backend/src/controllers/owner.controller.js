const safeMsg = require("../utils/safeMsg");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Owner = require("../models/Owner");
const Follow = require("../models/Follow");
const Room = require("../models/room.model");
const AnalyticsEvent = require("../models/analyticsEvent.model");
const { createUniqueSlug } = require("../utils/publicSlug");
const { notifyAdmin } = require("../services/adminAlert.service");
const { ownerUpdateSchema } = require("../validators/owner.validator");

const createOwnerToken = (owner) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing in .env");
  }
  return jwt.sign(
    { id: owner._id, phone: owner.phone, role: "owner" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ===============================
// Create Owner (Super Admin only)
// ===============================
const createOwner = async (req, res) => {
  try {
    const { name, phone, password, propertyName } = req.body;

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Valid 10-digit mobile number required" });
    }

    const existing = await Owner.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: "Owner with this mobile number already exists" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const owner = await Owner.create({
      name,
      phone,
      password,
      propertyName,
    });

    notifyAdmin({
      type: "owner_submission",
      title: "New owner added",
      message: "A new owner account was created.",
      link: "/admin/owners",
    });

    const { logActivity } = require("./activity.controller");
    await logActivity("owner_added", `New owner added: ${owner.name}`, owner._id, "Owner");

    res.status(201).json({
      message: "Owner created successfully",
      owner: {
        _id: owner._id,
        name: owner.name,
        phone: owner.phone,
        propertyName: owner.propertyName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create owner", error: safeMsg(error) });
  }
};

// ===============================
// Owner Login
// ===============================
const ownerLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Mobile number and password are required" });
    }

    const owner = await Owner.findOne({ phone });
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = createOwnerToken(owner);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: owner._id,
        name: owner.name,
        phone: owner.phone,
        propertyName: owner.propertyName,
        role: "owner",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed", error: safeMsg(error) });
  }
};

// ===============================
// Get All Owners (with room counts)
// ===============================
const getAllOwners = async (req, res) => {
  try {
    const owners = await Owner.find().select("-password");

    const ownersWithStats = await Promise.all(
      owners.map(async (owner) => {
        const totalRooms = await Room.countDocuments({ owner: owner._id });
        const occupiedRooms = await Room.countDocuments({ owner: owner._id, status: "occupied" });
        return {
          ...owner.toObject(),
          totalRooms,
          occupiedRooms,
          vacantRooms: totalRooms - occupiedRooms,
        };
      })
    );

    res.json(ownersWithStats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch owners", error: safeMsg(error) });
  }
};

// ===============================
// Get Single Owner + their rooms
// ===============================
const getSingleOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id).select("-password");
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    const { computeRentStatus } = require("./room.controller");

    const rooms = await Room.find({ owner: owner._id }).populate(
      "property",
      "name buildings"
    );

    const roomsWithStatus = rooms.map((room) => {
      const roomObj = room.toObject();
      if (room.status === "occupied") {
        roomObj.liveRentStatus = computeRentStatus(room.currentTenant?.nextDueDate);
      }
      return roomObj;
    });

    res.json({ owner, rooms: roomsWithStatus });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch owner", error: safeMsg(error) });
  }
};

// ===============================
// Update Owner
// ===============================
const updateOwner = async (req, res) => {
  try {
    const validation = ownerUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid owner profile",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

    const owner = await Owner.findByIdAndUpdate(
      req.params.id,
      validation.data,
      { new: true, runValidators: true }
    ).select("-password");

    if (!owner) return res.status(404).json({ message: "Owner not found" });

    res.json({ message: "Owner updated", owner });
  } catch (error) {
    res.status(500).json({ message: "Failed to update owner", error: safeMsg(error) });
  }
};

// ===============================
// Delete Owner
// ===============================
const deleteOwner = async (req, res) => {
  try {
    const owner = await Owner.findByIdAndDelete(req.params.id);
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    res.json({ message: "Owner deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete owner", error: safeMsg(error) });
  }
};


// ===============================
// Get Logged-in Owner's Own Profile + Rooms
// ===============================
const getMyRooms = async (req, res) => {
  try {
    const owner = await Owner.findById(req.user._id).select("-password");
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    const { computeRentStatus } = require("./room.controller");

    const rooms = await Room.find({ owner: owner._id });
    const roomIds = rooms.map((room) => room._id);
    const engagementRows = roomIds.length
      ? await AnalyticsEvent.aggregate([
          { $match: { owner: owner._id, listingId: { $in: roomIds }, listingType: { $in: ["room", "pg", "hostel", "flat"] } } },
          {
            $group: {
              _id: "$listingId",
              views: { $sum: { $cond: [{ $eq: ["$type", "listing_view"] }, 1, 0] } },
              calls: { $sum: { $cond: [{ $eq: ["$type", "call_click"] }, 1, 0] } },
              whatsapp: { $sum: { $cond: [{ $eq: ["$type", "whatsapp_click"] }, 1, 0] } },
              contacts: { $sum: { $cond: [{ $eq: ["$type", "contact_request"] }, 1, 0] } },
            },
          },
        ])
      : [];
    const engagementByRoom = new Map(engagementRows.map((row) => [String(row._id), row]));

    const roomsWithStatus = rooms.map((room) => {
      const roomObj = room.toObject();
      const counts = engagementByRoom.get(String(room._id)) || { views: 0, calls: 0, whatsapp: 0, contacts: 0 };
      roomObj.views = counts.views;
      roomObj.inquiryCounts = { call: counts.calls, whatsapp: counts.whatsapp, contacts: counts.contacts };
      if (room.status === "occupied") {
        roomObj.liveRentStatus = computeRentStatus(room.currentTenant?.nextDueDate);
      }
      return roomObj;
    });

    res.json({ owner, rooms: roomsWithStatus });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard data", error: safeMsg(error) });
  }
};

const getPublicOwnerProfile = async (req, res) => {
  try {
    const idOrSlug = req.params.id;
    const query = /^[0-9a-fA-F]{24}$/.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
    const owner = await Owner.findOne(query).select(
      "name propertyName slug instagram facebook youtube createdAt isVerified bio photo area"
    );
    if (!owner) return res.status(404).json({ message: "Owner not found" });
    if (!owner.slug) {
      owner.slug = await createUniqueSlug(Owner, `${owner.name} ${owner.propertyName || ""}`, owner._id);
      await Owner.updateOne({ _id: owner._id, $or: [{ slug: { $exists: false } }, { slug: "" }] }, { $set: { slug: owner.slug } });
    }

    const totalListings = await Room.countDocuments({ owner: owner._id, status: "vacant" });

    res.json({ owner, totalListings });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch owner profile", error: safeMsg(error) });
  }
};

const getOwnerProfileBySlug = async (req, res) => {
  try {
    const owner = await Owner.findOne({ slug: req.params.slug }).select(
      "name propertyName slug bio photo area isVerified"
    );
    if (!owner) return res.status(404).json({ success: false, message: "Owner not found" });

    const [listingsCount, followersCount, isFollowing] = await Promise.all([
      Room.countDocuments({ owner: owner._id, status: "vacant" }),
      Follow.countDocuments({ owner: owner._id }),
      ["user", "admin"].includes(req.user?.role)
        ? Follow.exists({ owner: owner._id, follower: req.user._id })
        : Promise.resolve(false),
    ]);

    res.json({
      success: true,
      owner,
      listingsCount,
      followersCount,
      isFollowing: Boolean(isFollowing),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

module.exports = {
  createOwner,
  getPublicOwnerProfile,
  getOwnerProfileBySlug,
  ownerLogin,
  getAllOwners,
  getSingleOwner,
  updateOwner,
  deleteOwner,
  getMyRooms,
};
