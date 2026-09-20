const safeMsg = require("../utils/safeMsg");
const HourlyRoom = require("../models/HourlyRoom.model");

// Admin: create hourly room directly
const createHourlyRoom = async (req, res) => {
  try {
    const images = req.files && req.files.length > 0 ? req.files.map((f) => f.path) : [];

    const room = await HourlyRoom.create({
      ...req.body,
      images,
      approvedByAdmin: req.user?._id,
      status: "approved",
      isActive: true,
    });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: "Failed to create hourly room", error: safeMsg(err) });
  }
};

// Admin: get all hourly rooms (pending + approved + rejected)
const getAllHourlyRooms = async (req, res) => {
  try {
    const rooms = await HourlyRoom.find()
      .populate("requestedByOwner", "name email")
      .sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch hourly rooms", error: safeMsg(err) });
  }
};

// Public: only active/approved rooms
const getPublicHourlyRooms = async (req, res) => {
  try {
    const rooms = await HourlyRoom.find({ isActive: true, status: "approved" }).sort({
      createdAt: -1,
    });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch hourly rooms", error: safeMsg(err) });
  }
};

// Admin: update any field
const updateHourlyRoom = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((f) => f.path);
    }

    const room = await HourlyRoom.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    if (!room) return res.status(404).json({ message: "Hourly room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: "Failed to update hourly room", error: safeMsg(err) });
  }
};

// Admin: delete
const deleteHourlyRoom = async (req, res) => {
  try {
    const room = await HourlyRoom.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: "Hourly room not found" });
    res.json({ message: "Hourly room deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete hourly room", error: safeMsg(err) });
  }
};

// Admin: approve an owner's request
const approveHourlyRoomRequest = async (req, res) => {
  try {
    const room = await HourlyRoom.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        isActive: true,
        approvedByAdmin: req.user?._id,
        rejectionReason: "",
      },
      { new: true }
    );
    if (!room) return res.status(404).json({ message: "Hourly room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: "Failed to approve request", error: safeMsg(err) });
  }
};

// Admin: reject an owner's request
const rejectHourlyRoomRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const room = await HourlyRoom.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        isActive: false,
        rejectionReason: reason || "Not specified",
      },
      { new: true }
    );
    if (!room) return res.status(404).json({ message: "Hourly room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: "Failed to reject request", error: safeMsg(err) });
  }
};

module.exports = {
  createHourlyRoom,
  getAllHourlyRooms,
  getPublicHourlyRooms,
  updateHourlyRoom,
  deleteHourlyRoom,
  approveHourlyRoomRequest,
  rejectHourlyRoomRequest,
};
