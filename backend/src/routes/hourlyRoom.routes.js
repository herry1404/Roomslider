const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");
const upload = require("../middleware/upload.middleware");

const {
  createHourlyRoom,
  getAllHourlyRooms,
  getPublicHourlyRooms,
  updateHourlyRoom,
  deleteHourlyRoom,
  approveHourlyRoomRequest,
  rejectHourlyRoomRequest,
} = require("../controllers/hourlyRoom.controller");

// ===============================
// Public
// ===============================

router.get("/public", getPublicHourlyRooms);

// ===============================
// Admin
// ===============================

router.post("/", protect, adminOnly, upload.array("images", 10), createHourlyRoom);
router.get("/", protect, adminOnly, getAllHourlyRooms);
router.put("/:id", protect, adminOnly, upload.array("images", 10), updateHourlyRoom);
router.delete("/:id", protect, adminOnly, deleteHourlyRoom);
router.put("/:id/approve", protect, adminOnly, approveHourlyRoomRequest);
router.put("/:id/reject", protect, adminOnly, rejectHourlyRoomRequest);

module.exports = router;
