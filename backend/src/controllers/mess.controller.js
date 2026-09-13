const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Mess = require("../models/Mess");
const MessOrder = require("../models/MessOrder");

const createMessToken = (mess) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing in .env");
  }
  return jwt.sign(
    { id: mess._id, phone: mess.phone, role: "mess" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ===============================
// Mess Login (public)
// ===============================
const messLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Mobile number and password are required" });
    }

    const mess = await Mess.findOne({ phone });
    if (!mess) {
      return res.status(404).json({ message: "Mess not found" });
    }

    const isMatch = await bcrypt.compare(password, mess.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = createMessToken(mess);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: mess._id,
        name: mess.name,
        phone: mess.phone,
        role: "mess",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// ===============================
// Create Mess (Admin only)
// ===============================
const createMess = async (req, res) => {
  try {
    const { name, phone, password, address, latitude, longitude, pricePerPerson } = req.body;

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Valid 10-digit mobile number required" });
    }

    const existing = await Mess.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: "Mess with this mobile number already exists" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "Location (latitude, longitude) is required" });
    }

    const mess = await Mess.create({
      name,
      phone,
      password,
      address,
      pricePerPerson,
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      },
    });

    res.status(201).json({
      message: "Mess created successfully",
      mess: {
        _id: mess._id,
        name: mess.name,
        phone: mess.phone,
        address: mess.address,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create mess", error: error.message });
  }
};

// ===============================
// Get All Mess (Admin only)
// ===============================
const getAllMess = async (req, res) => {
  try {
    const messList = await Mess.find().select("-password");
    res.json(messList);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch mess list", error: error.message });
  }
};

// ===============================
// Get Single Mess (Admin only)
// ===============================
const getSingleMess = async (req, res) => {
  try {
    const mess = await Mess.findById(req.params.id).select("-password");
    if (!mess) return res.status(404).json({ message: "Mess not found" });
    res.json(mess);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch mess", error: error.message });
  }
};

// ===============================
// Update Mess (Admin only)
// ===============================
const updateMess = async (req, res) => {
  try {
    const { name, address, pricePerPerson, latitude, longitude, isActive } = req.body;

    const updateData = { name, address, pricePerPerson, isActive };

    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    const mess = await Mess.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).select("-password");

    if (!mess) return res.status(404).json({ message: "Mess not found" });

    res.json({ message: "Mess updated", mess });
  } catch (error) {
    res.status(500).json({ message: "Failed to update mess", error: error.message });
  }
};

// ===============================
// Delete Mess (Admin only)
// ===============================
const deleteMess = async (req, res) => {
  try {
    const mess = await Mess.findByIdAndDelete(req.params.id);
    if (!mess) return res.status(404).json({ message: "Mess not found" });
    res.json({ message: "Mess deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete mess", error: error.message });
  }
};

// ===============================
// Get Nearby Mess List (public) — sorted by distance from user
// ===============================
const getNearbyMess = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    let messList;

    if (lat && lng) {
      messList = await Mess.find({
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number(lng), Number(lat)],
            },
          },
        },
      }).select("-password");
    } else {
      messList = await Mess.find({ isActive: true }).select("-password");
    }

    res.json(messList);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch nearby mess", error: error.message });
  }
};

// ===============================
// Get Single Mess Public Detail
// ===============================
const getMessDetail = async (req, res) => {
  try {
    const mess = await Mess.findById(req.params.id).select("-password");
    if (!mess) return res.status(404).json({ message: "Mess not found" });
    res.json(mess);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch mess", error: error.message });
  }
};

// ===============================
// Mess Owner: Update Today's Menu
// ===============================
const updateTodayMenu = async (req, res) => {
  try {
    const { items } = req.body;

    const today = new Date().toISOString().slice(0, 10);

    const mess = await Mess.findByIdAndUpdate(
      req.user._id,
      { todayMenu: { date: today, items: items || [] } },
      { new: true }
    ).select("-password");

    if (!mess) return res.status(404).json({ message: "Mess not found" });

    res.json({ message: "Menu updated", mess });
  } catch (error) {
    res.status(500).json({ message: "Failed to update menu", error: error.message });
  }
};

// ===============================
// Mess Owner: Get My Profile + Today's Order Count
// ===============================
const getMyMessDashboard = async (req, res) => {
  try {
    const mess = await Mess.findById(req.user._id).select("-password");
    if (!mess) return res.status(404).json({ message: "Mess not found" });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayOrderCount = await MessOrder.countDocuments({
      mess: mess._id,
      createdAt: { $gte: startOfDay },
    });

    res.json({ mess, todayOrderCount });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard", error: error.message });
  }
};

module.exports = {
  messLogin,
  createMess,
  getAllMess,
  getSingleMess,
  updateMess,
  deleteMess,
  getNearbyMess,
  getMessDetail,
  updateTodayMenu,
  getMyMessDashboard,
};
