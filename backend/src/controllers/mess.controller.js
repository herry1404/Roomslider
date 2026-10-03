const safeMsg = require("../utils/safeMsg");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Mess = require("../models/Mess");
const MessOrder = require("../models/MessOrder");
const MessReview = require("../models/MessReview");
const { createUniqueMessSlug, ensureMessSlugs } = require("../utils/messSlug");

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
    res.status(500).json({ message: "Login failed", error: safeMsg(error) });
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

    const imageUrls = req.files ? req.files.map((file) => file.path) : [];

    const mess = await Mess.create({
      name,
      slug: await createUniqueMessSlug(Mess, name),
      phone,
      password,
      address,
      pricePerPerson,
      images: imageUrls,
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
    res.status(500).json({ message: "Failed to create mess", error: safeMsg(error) });
  }
};

// ===============================
// Get All Mess (Admin only)
// ===============================
const getAllMess = async (req, res) => {
  try {
    const messList = await ensureMessSlugs(Mess, await Mess.find().select("-password"));
    res.json(messList);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch mess list", error: safeMsg(error) });
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
    res.status(500).json({ message: "Failed to fetch mess", error: safeMsg(error) });
  }
};

// ===============================
// Update Mess (Admin only)
// ===============================
const updateMess = async (req, res) => {
  try {
    const { name, address, pricePerPerson, latitude, longitude, isActive } = req.body;

    const updateData = { name, address, pricePerPerson, isActive };
    if (name !== undefined) {
      updateData.slug = await createUniqueMessSlug(Mess, name, req.params.id);
    }

    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((file) => file.path);
    }

    const mess = await Mess.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).select("-password");

    if (!mess) return res.status(404).json({ message: "Mess not found" });

    res.json({ message: "Mess updated", mess });
  } catch (error) {
    res.status(500).json({ message: "Failed to update mess", error: safeMsg(error) });
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
    res.status(500).json({ message: "Failed to delete mess", error: safeMsg(error) });
  }
};

// ===============================
// Get Nearby Mess List (public) — sorted by distance from user
// ===============================
const getNearbyMess = async (req, res) => {
  try {
    const lat = req.query.lat == null ? null : Number(req.query.lat);
    const lng = req.query.lng == null ? null : Number(req.query.lng);
    if ((lat == null) !== (lng == null) || (lat != null && (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    ))) {
      return res.status(400).json({ message: "Valid latitude and longitude are required." });
    }

    let messList;

    if (lat != null && lng != null) {
      messList = await Mess.find({
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
          },
        },
      }).select("-password");
    } else {
      messList = await Mess.find({ isActive: true }).select("-password").sort({ name: 1 });
    }

    messList = await ensureMessSlugs(Mess, messList);
    res.json(messList);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch nearby mess", error: safeMsg(error) });
  }
};

// ===============================
// Get Single Mess Public Detail
// ===============================
const getMessDetail = async (req, res) => {
  try {
    const identifier = req.params.id;
    const query = /^[a-f\d]{24}$/i.test(identifier)
      ? { _id: identifier }
      : { slug: identifier.toLowerCase() };
    let mess = await Mess.findOne(query).select("-password");
    if (!mess) return res.status(404).json({ message: "Mess not found" });
    [mess] = await ensureMessSlugs(Mess, [mess]);
    res.json(mess);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch mess", error: safeMsg(error) });
  }
};

const getMessReviews = async (req, res) => {
  try {
    const identifier = req.params.id;
    const messQuery = /^[a-f\d]{24}$/i.test(identifier)
      ? { _id: identifier }
      : { slug: identifier.toLowerCase() };
    const mess = await Mess.findOne(messQuery).select("_id");
    if (!mess) return res.status(404).json({ message: "Mess not found" });
    const reviews = await MessReview.find({ mess: mess._id })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch mess reviews", error: safeMsg(error) });
  }
};

const createMessReview = async (req, res) => {
  try {
    if (!["user", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Customer account required to review a mess." });
    }
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length > 500) {
      return res.status(400).json({ message: "Enter a rating from 1 to 5 and a comment under 500 characters." });
    }

    const identifier = req.params.id;
    const messQuery = /^[a-f\d]{24}$/i.test(identifier)
      ? { _id: identifier }
      : { slug: identifier.toLowerCase() };
    const mess = await Mess.findOne(messQuery);
    if (!mess || !mess.isActive) return res.status(404).json({ message: "Mess not found" });

    const reviewedOrderIds = await MessReview.distinct("order", {
      mess: mess._id,
      user: req.user._id,
    });
    const order = await MessOrder.findOne({
      mess: mess._id,
      user: req.user._id,
      paymentStatus: "paid",
      _id: { $nin: reviewedOrderIds },
    }).sort({ createdAt: -1 });
    if (!order) {
      const hasPaidOrder = await MessOrder.exists({
        mess: mess._id,
        user: req.user._id,
        paymentStatus: "paid",
      });
      return hasPaidOrder
        ? res.status(409).json({ message: "You have already reviewed your paid orders." })
        : res.status(403).json({ message: "Place a paid order before reviewing this mess." });
    }

    const review = await MessReview.create({
      mess: mess._id,
      user: req.user._id,
      order: order._id,
      rating,
      comment,
    });

    const [summary] = await MessReview.aggregate([
      { $match: { mess: mess._id } },
      { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    await Mess.updateOne({ _id: mess._id }, {
      $set: { ratingAverage: summary.average, ratingCount: summary.count },
    });

    await review.populate("user", "name");
    res.status(201).json({
      message: "Review submitted",
      review,
      ratingAverage: summary.average,
      ratingCount: summary.count,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You have already reviewed this order." });
    }
    console.error("CREATE MESS REVIEW ERROR:", error);
    res.status(500).json({ message: "Failed to submit review", error: safeMsg(error) });
  }
};

// ===============================
// Mess Owner: Update Today's Menu
// ===============================
const updateTodayMenu = async (req, res) => {
  try {
    if (req.user.role !== "mess") {
      return res.status(403).json({ message: "Mess owner access required" });
    }
    const { items, mealType = "thali" } = req.body;
    if (!Array.isArray(items) || items.length > 50 || !["thali", "tiffin"].includes(mealType)) {
      return res.status(400).json({ message: "Provide a valid meal type and menu." });
    }

    const cleanItems = [];
    for (const item of items) {
      const entry = typeof item === "string" ? { name: item } : item;
      if (!entry || typeof entry !== "object") {
        return res.status(400).json({ message: "Each menu item must be valid." });
      }
      const name = typeof entry.name === "string" ? entry.name.trim() : "";
      const category = typeof entry.category === "string" ? entry.category.trim() : "Other";
      const calories = entry.calories === "" || entry.calories == null ? null : Number(entry.calories);
      if (
        !name ||
        name.length > 100 ||
        category.length > 60 ||
        (calories !== null && (!Number.isFinite(calories) || calories < 0 || calories > 10000))
      ) {
        return res.status(400).json({ message: "Menu item names, sections, or calories are invalid." });
      }
      cleanItems.push({ name, category: category || "Other", calories });
    }

    const today = new Date().toISOString().slice(0, 10);

    const mess = await Mess.findByIdAndUpdate(
      req.user._id,
      { $set: { todayMenu: { date: today, items: cleanItems }, mealType } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!mess) return res.status(404).json({ message: "Mess not found" });

    res.json({ message: "Menu updated", mess });
  } catch (error) {
    res.status(500).json({ message: "Failed to update menu", error: safeMsg(error) });
  }
};

const updateMessAddOns = async (req, res) => {
  try {
    if (req.user.role !== "mess") {
      return res.status(403).json({ message: "Mess owner access required" });
    }

    const { addOns } = req.body;
    if (!Array.isArray(addOns) || addOns.length > 30) {
      return res.status(400).json({ message: "Provide no more than 30 add-ons." });
    }

    const cleanAddOns = [];
    for (const item of addOns) {
      if (!item || typeof item !== "object") {
        return res.status(400).json({ message: "Each add-on must be an object." });
      }
      const name = typeof item.name === "string" ? item.name.trim() : "";
      const price = Number(item.price);
      if (!name || name.length > 80 || !Number.isFinite(price) || price < 0) {
        return res.status(400).json({ message: "Each add-on needs a name and a valid non-negative price." });
      }
      cleanAddOns.push({
        name,
        price,
        isAvailable: item.isAvailable !== false,
      });
    }

    const mess = await Mess.findByIdAndUpdate(
      req.user._id,
      { $set: { addOns: cleanAddOns } },
      { new: true, runValidators: true }
    ).select("-password");
    if (!mess) return res.status(404).json({ message: "Mess not found" });

    res.json({ message: "Add-ons updated", mess });
  } catch (error) {
    console.error("UPDATE MESS ADD-ONS ERROR:", error);
    res.status(500).json({ message: "Failed to update add-ons", error: safeMsg(error) });
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
      paymentStatus: "paid",
    });

    res.json({ mess, todayOrderCount });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard", error: safeMsg(error) });
  }
};

// ===============================
// Mess Owner: Get Today's Orders (subscriber/order list)
// ===============================
const getTodayOrders = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const orders = await MessOrder.find({
      mess: req.user._id,
      createdAt: { $gte: startOfDay },
      paymentStatus: "paid",
    })
      .populate("user", "name phone avatar")
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: safeMsg(error) });
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
  getMessReviews,
  createMessReview,
  getTodayOrders,
  updateTodayMenu,
  updateMessAddOns,
  getMyMessDashboard,
};
