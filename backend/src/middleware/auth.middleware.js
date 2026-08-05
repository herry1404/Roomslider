const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Owner = require("../models/Owner");

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
    } else {
      account = await User.findById(decoded.id).select("-password");
    }

    if (!account) {
      return res.status(401).json({ success: false, message: "User nahi mila" });
    }

    req.user = account.toObject ? account.toObject() : account;
    if (decoded.role === "owner") req.user.role = "owner"; // safety net
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid ya expired token" });
  }
};

module.exports = { protect };
