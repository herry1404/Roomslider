const SavedSearch = require("../models/SavedSearch");
const safeMsg = require("../utils/safeMsg");

const listSavedSearches = async (req, res) => {
  try {
    const searches = await SavedSearch.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, searches });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const createSavedSearch = async (req, res) => {
  try {
    const area = String(req.body?.area || "").trim();
    const category = req.body?.category || "Any";
    const gender = req.body?.gender || "Any";
    const maxPrice = req.body?.maxPrice === "" || req.body?.maxPrice == null
      ? 0
      : Number(req.body.maxPrice);
    if (!area || area.length > 80) {
      return res.status(400).json({ success: false, message: "Area is required and must be 80 characters or fewer" });
    }
    if (!["Any", "Room", "PG", "Hostel", "Flat"].includes(category)) {
      return res.status(400).json({ success: false, message: "Choose a valid listing category" });
    }
    if (!["Any", "Male", "Female"].includes(gender)) {
      return res.status(400).json({ success: false, message: "Choose a valid gender preference" });
    }
    if (!Number.isFinite(maxPrice) || maxPrice < 0) {
      return res.status(400).json({ success: false, message: "Maximum price must be zero or a positive amount" });
    }

    const areaNormalized = area.toLowerCase();
    const search = await SavedSearch.create({
      user: req.user._id,
      area,
      areaNormalized,
      category,
      maxPrice,
      gender,
    });
    res.status(201).json({ success: true, search });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "This saved search already exists" });
    }
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const deleteSavedSearch = async (req, res) => {
  try {
    const search = await SavedSearch.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!search) return res.status(404).json({ success: false, message: "Saved search not found" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

module.exports = { listSavedSearches, createSavedSearch, deleteSavedSearch };
