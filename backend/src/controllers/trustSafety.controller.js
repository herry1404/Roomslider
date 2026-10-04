const mongoose = require("mongoose");
const Room = require("../models/room.model");
const Owner = require("../models/Owner");
const ListingReport = require("../models/listingReport.model");
const safeMsg = require("../utils/safeMsg");

const setRoomVerification = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }
    if (typeof req.body?.isVerified !== "boolean") {
      return res.status(400).json({ success: false, message: "isVerified must be true or false" });
    }
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { isVerified: req.body.isVerified },
      { new: true, runValidators: true }
    ).select("_id isVerified");
    if (!room) return res.status(404).json({ success: false, message: "Listing not found" });
    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const setOwnerVerification = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }
    if (typeof req.body?.isVerified !== "boolean") {
      return res.status(400).json({ success: false, message: "isVerified must be true or false" });
    }
    const owner = await Owner.findByIdAndUpdate(
      req.params.id,
      { isVerified: req.body.isVerified },
      { new: true, runValidators: true }
    ).select("_id isVerified");
    if (!owner) return res.status(404).json({ success: false, message: "Owner not found" });
    res.json({ success: true, owner });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const createListingReport = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }
    const reason = String(req.body?.reason || "").trim();
    if (reason.length < 5 || reason.length > 500) {
      return res.status(400).json({ success: false, message: "Please enter a reason between 5 and 500 characters" });
    }
    const room = await Room.findById(req.params.id).select("_id");
    if (!room) return res.status(404).json({ success: false, message: "Listing not found" });

    const report = await ListingReport.create({ room: room._id, reporter: req.user._id, reason });
    res.status(201).json({ success: true, report: { _id: report._id, status: report.status } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "You have already reported this listing" });
    }
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const listListingReports = async (_req, res) => {
  try {
    const reports = await ListingReport.find({})
      .populate("room", "title slug location category")
      .populate("reporter", "name email")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const setListingReportStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }
    const { status } = req.body || {};
    if (!["open", "resolved"].includes(status)) {
      return res.status(400).json({ success: false, message: "Choose open or resolved status" });
    }
    const report = await ListingReport.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

module.exports = {
  setRoomVerification,
  setOwnerVerification,
  createListingReport,
  listListingReports,
  setListingReportStatus,
};
