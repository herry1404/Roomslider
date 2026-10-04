const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Owner = require("../models/Owner");
const Mess = require("../models/Mess");
const HourlyRoomManager = require("../models/HourlyRoomManager");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Login zaroori hai (token missing)" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let account;
    if (decoded.role === "owner") {
      account = await Owner.findById(decoded.id).select("-password");
    } else if (decoded.role === "mess") {
      account = await Mess.findById(decoded.id).select("-password");
    } else if (decoded.role === "hourlyManager") {
      account = await HourlyRoomManager.findById(decoded.id).select("-password");
    } else {
      account = await User.findById(decoded.id).select("-password");
    }

    if (!account) {
      return res.status(401).json({ success: false, message: "User nahi mila" });
    }

    req.user = account.toObject ? account.toObject() : account;
    if (decoded.role === "owner") req.user.role = "owner";
    if (decoded.role === "mess") req.user.role = "mess";
    if (decoded.role === "hourlyManager") req.user.role = "hourlyManager";
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid ya expired token" });
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    let account;
    if (decoded.role === "owner") {
      account = await Owner.findById(decoded.id).select("-password");
    } else if (decoded.role === "mess") {
      account = await Mess.findById(decoded.id).select("-password");
    } else if (decoded.role === "hourlyManager") {
      account = await HourlyRoomManager.findById(decoded.id).select("-password");
    } else {
      account = await User.findById(decoded.id).select("-password");
    }
    if (account) {
      req.user = account.toObject ? account.toObject() : account;
      if (decoded.role === "owner" || decoded.role === "mess" || decoded.role === "hourlyManager") {
        req.user.role = decoded.role;
      }
    }
  } catch {
    // Public routes remain available when an optional/stale token is present.
  }
  next();
};

module.exports = { protect, optionalAuth };
