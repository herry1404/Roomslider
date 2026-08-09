const Maintenance = require("../models/maintenance.model");
const Room = require("../models/room.model");

// Tenant raises a maintenance request for their room.
// Photo is optional; multer-cloudinary middleware (if used) attaches req.file.path as the hosted URL.
const createRequest = async (req, res) => {
  try {
    const { roomId, title, description, category } = req.body;

    if (!roomId || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "Room, title and description are required",
      });
    }

    const room = await Room.findById(roomId).select("_id currentTenant");

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const request = await Maintenance.create({
      room: roomId,
      tenant: req.user._id,
      title,
      description,
      category: category || "other",
      photoUrl: req.file ? req.file.path : null,
    });

    res.status(201).json({ success: true, request });
  } catch (error) {
    console.error("CREATE MAINTENANCE REQUEST ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create maintenance request",
    });
  }
};

// Tenant views their own requests for their current room.
const getMyRequests = async (req, res) => {
  try {
    const requests = await Maintenance.find({ tenant: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("GET MY MAINTENANCE REQUESTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance requests",
    });
  }
};

// Owner views requests across all rooms they own.
const getOwnerRequests = async (req, res) => {
  try {
    const rooms = await Room.find({ owner: req.user._id }).select("_id");
    const roomIds = rooms.map((r) => r._id);

    const requests = await Maintenance.find({ room: { $in: roomIds } })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("room", "roomNumber")
      .populate("tenant", "name phone")
      .lean();

    res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("GET OWNER MAINTENANCE REQUESTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance requests",
    });
  }
};

// Owner updates request status.
const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const request = await Maintenance.findById(req.params.id).populate(
      "room",
      "owner"
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (String(request.room.owner) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    request.status = status;
    await request.save();

    res.status(200).json({ success: true, request });
  } catch (error) {
    console.error("UPDATE MAINTENANCE STATUS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getOwnerRequests,
  updateRequestStatus,
};
