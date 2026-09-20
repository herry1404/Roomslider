const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "./.env" });

const User = require("../models/user.model");

const createAdmin = async () => {
  const email = (process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password || password.length < 12) {
    console.log("SEED_ADMIN_EMAIL aur SEED_ADMIN_PASSWORD (12+ chars) set karo");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected ✅");

    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      console.log("Super Admin already exists ✅");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name: "Super Admin",
      email,
      phone: "9999999999",
      password: hashedPassword,
      role: "admin",
    });

    console.log("🎉 Super Admin Created Successfully:", email);
    process.exit();
  } catch (error) {
    console.log("Admin Creation Error ❌", error.message);
    process.exit(1);
  }
};

createAdmin();
