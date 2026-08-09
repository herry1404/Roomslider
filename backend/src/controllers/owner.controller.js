const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Owner = require("../models/Owner");
const Room = require("../models/room.model");

const createOwnerToken = (owner) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing in .env");
  }
  return jwt.sign(
    { id: owner._id, email: owner.email, role: "owner" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ===============================
// Create Owner (Super Admin only)
// ===============================
const createOwner = async (req, res) => {
  try {
    const { name, email, password, propertyName } = req.body;

    const existing = await Owner.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Owner with this email already exists" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const owner = await Owner.create({
      name,
      email,
      password,
      propertyName,
    });

    res.status(201).json({
      message: "Owner created successfully",
      owner: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        propertyName: owner.propertyName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create owner", error: error.message });
  }
};

// ===============================
// Owner Login
// ===============================
const ownerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const owner = await Owner.findOne({ email });
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
        email: owner.email,
        propertyName: owner.propertyName,
        role: "owner",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed", error: error.message });
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
    res.status(500).json({ message: "Failed to fetch owners", error: error.message });
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

    const rooms = await Room.find({ owner: owner._id });

    const roomsWithStatus = rooms.map((room) => {
      const roomObj = room.toObject();
      if (room.status === "occupied") {
        roomObj.liveRentStatus = computeRentStatus(room.currentTenant?.nextDueDate);
      }
      return roomObj;
    });

    res.json({ owner, rooms: roomsWithStatus });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch owner", error: error.message });
  }
};

// ===============================
// Update Owner
// ===============================
const updateOwner = async (req, res) => {
  try {
    const { name, propertyName } = req.body;
    const owner = await Owner.findByIdAndUpdate(
      req.params.id,
      { name, propertyName },
      { new: true }
    ).select("-password");

    if (!owner) return res.status(404).json({ message: "Owner not found" });

    res.json({ message: "Owner updated", owner });
  } catch (error) {
    res.status(500).json({ message: "Failed to update owner", error: error.message });
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
    res.status(500).json({ message: "Failed to delete owner", error: error.message });
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

    // Attach a live-computed rent status (paid/pending/overdue) to each
    // occupied room, so the dashboard never shows a stale "paid" forever.
    const roomsWithStatus = rooms.map((room) => {
      const roomObj = room.toObject();
      if (room.status === "occupied") {
        roomObj.liveRentStatus = computeRentStatus(room.currentTenant?.nextDueDate);
      }
      return roomObj;
    });

    res.json({ owner, rooms: roomsWithStatus });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard data", error: error.message });
  }
};

module.exports = {
  createOwner,
  ownerLogin,
  getAllOwners,
  getSingleOwner,
  updateOwner,
  deleteOwner,
  getMyRooms,
};

