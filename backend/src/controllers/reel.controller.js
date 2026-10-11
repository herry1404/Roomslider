const { Readable } = require("node:stream");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const Owner = require("../models/Owner");
const Reel = require("../models/Reel");
const Room = require("../models/room.model");

const PAGE_SIZE = 10;
const MAX_DURATION_SECONDS = 60;
const safeMsg = (error) =>
  process.env.NODE_ENV === "production" ? "Something went wrong" : error.message;

const getPagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  return { page, limit: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE };
};

const uploadVideo = (buffer) =>
  new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { folder: "roomslider/reels", resource_type: "video" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    Readable.from([buffer]).pipe(upload);
  });

const removeCloudinaryVideo = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "video",
    invalidate: true,
  });
};

const reelThumbnail = (publicId) =>
  cloudinary.url(publicId, {
    resource_type: "video",
    format: "jpg",
    secure: true,
    transformation: [{ width: 720, height: 1280, crop: "limit" }],
  });

const populateReels = (query) =>
  query
    .select("-videoPublicId")
    .populate("owner", "name propertyName slug photo")
    .populate("room", "title slug images location price category");

const getReels = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { status: "active" };
    const [reels, total] = await Promise.all([
      populateReels(Reel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
      Reel.countDocuments(filter),
    ]);

    res.json({ success: true, reels, page, limit, total, hasMore: skip + reels.length < total });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const getAdminReels = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [reels, total] = await Promise.all([
      populateReels(Reel.find().sort({ createdAt: -1 }).skip(skip).limit(limit)),
      Reel.countDocuments(),
    ]);

    res.json({ success: true, reels, page, limit, total, hasMore: skip + reels.length < total });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const getOwnerReels = async (req, res) => {
  try {
    const owner = await Owner.findOne({ slug: req.params.slug }).select("_id");
    if (!owner) return res.status(404).json({ success: false, message: "Owner not found" });

    const { page, limit, skip } = getPagination(req.query);
    const filter = { owner: owner._id, status: "active" };
    const [reels, total] = await Promise.all([
      populateReels(Reel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
      Reel.countDocuments(filter),
    ]);

    res.json({ success: true, reels, page, limit, total, hasMore: skip + reels.length < total });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const getMyReels = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ success: false, message: "Owner account required" });
    }
    const { page, limit, skip } = getPagination(req.query);
    const filter = { owner: req.user._id };
    const [reels, total] = await Promise.all([
      populateReels(Reel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
      Reel.countDocuments(filter),
    ]);

    res.json({ success: true, reels, page, limit, total, hasMore: skip + reels.length < total });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const createReel = async (req, res) => {
  let uploaded;
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ success: false, message: "Owner account required" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Choose a video to upload" });
    }

    const caption = typeof req.body.caption === "string" ? req.body.caption.trim() : "";
    if (caption.length > 300) {
      return res.status(400).json({ success: false, message: "Caption must be 300 characters or fewer" });
    }

    let room = null;
    if (req.body.room) {
      if (!mongoose.isValidObjectId(req.body.room)) {
        return res.status(400).json({ success: false, message: "Invalid linked room" });
      }
      room = await Room.findOne({
        _id: req.body.room,
        owner: req.user._id,
        status: "vacant",
      }).select("_id");
      if (!room) {
        return res.status(400).json({ success: false, message: "Choose one of your own room listings" });
      }
    }

    uploaded = await uploadVideo(req.file.buffer);
    if (!uploaded?.public_id || !uploaded.secure_url) {
      throw new Error("Cloudinary did not return a video URL");
    }
    if (!Number.isFinite(uploaded.duration) || uploaded.duration > MAX_DURATION_SECONDS) {
      await removeCloudinaryVideo(uploaded.public_id);
      uploaded = null;
      return res.status(400).json({ success: false, message: "Video must be 60 seconds or shorter" });
    }

    const reel = await Reel.create({
      owner: req.user._id,
      videoUrl: uploaded.secure_url,
      videoPublicId: uploaded.public_id,
      thumbnailUrl: reelThumbnail(uploaded.public_id),
      caption,
      room: room?._id || null,
    });

    res.status(201).json({ success: true, reel });
  } catch (error) {
    if (uploaded?.public_id) {
      try {
        await removeCloudinaryVideo(uploaded.public_id);
      } catch (cleanupError) {
        console.error("REEL VIDEO CLEANUP ERROR:", cleanupError);
      }
    }
    console.error("CREATE REEL ERROR:", error);
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const deleteReel = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid reel" });
    }

    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: "Reel not found" });
    if (req.user.role !== "admin" && (req.user.role !== "owner" || String(reel.owner) !== String(req.user._id))) {
      return res.status(403).json({ success: false, message: "You cannot delete this reel" });
    }

    await removeCloudinaryVideo(reel.videoPublicId);
    await reel.deleteOne();
    res.json({ success: true, message: "Reel deleted" });
  } catch (error) {
    console.error("DELETE REEL ERROR:", error);
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const updateReelStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid reel" });
    }
    if (!["active", "hidden"].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: "Status must be active or hidden" });
    }
    const reel = await Reel.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!reel) return res.status(404).json({ success: false, message: "Reel not found" });
    res.json({ success: true, reel });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

module.exports = {
  getReels,
  getAdminReels,
  getOwnerReels,
  getMyReels,
  createReel,
  deleteReel,
  updateReelStatus,
};
