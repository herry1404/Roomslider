const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const HourlyRoomManager = require("../models/HourlyRoomManager");

// Admin creates a new Hourly Room Manager
exports.createManager = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: "Name, phone and password are required" });
    }

    const existing = await HourlyRoomManager.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: "Manager with this phone already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const manager = await HourlyRoomManager.create({
      name,
      phone,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Hourly Room Manager created successfully",
      manager: {
        _id: manager._id,
        name: manager.name,
        phone: manager.phone,
        isActive: manager.isActive,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Manager login
exports.loginManager = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password are required" });
    }

    const manager = await HourlyRoomManager.findOne({ phone });
    if (!manager || !manager.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, manager.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: manager._id, role: "hourlyManager" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      manager: {
        _id: manager._id,
        name: manager.name,
        phone: manager.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// List all managers (admin use)
exports.getAllManagers = async (req, res) => {
  try {
    const managers = await HourlyRoomManager.find().select("-password");
    res.status(200).json(managers);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
