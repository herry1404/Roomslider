const express = require("express");
const router = express.Router();

const {
  createRoom,
  getRooms,
  getSingleRoom,
  updateRoom,
  deleteRoom,
  createBulkRooms,
  assignTenant,
  vacateTenant,
  recordPayment,
} = require("../controllers/room.controller");

const upload = require("../middleware/upload.middleware");
const { protect } = require("../middleware/auth.middleware");
const { adminOnly, adminOrOwner } = require("../middleware/admin.middleware");

// ===== PUBLIC =====

// Get all rooms (optional ?category=Room/PG/Hostel/Flat)
router.get("/", getRooms);

// Get single room
router.get("/:id", getSingleRoom);

// ===== ADMIN OR OWNER (ownership enforced inside controller) =====

// Add new room with multiple images
router.post("/", protect, adminOrOwner, upload.array("images", 10), createRoom);

// Bulk create rooms (e.g. Room 101 to 110 at once)
router.post("/bulk", protect, adminOrOwner, upload.array("images", 10), createBulkRooms);

// Update room (naye images optional hain)
router.put("/:id", protect, adminOrOwner, upload.array("images", 10), updateRoom);

// Delete room
router.delete("/:id", protect, adminOrOwner, deleteRoom);

// Assign a tenant to a room
router.put("/:id/assign-tenant", protect, adminOrOwner, assignTenant);

// Vacate a room (close current tenancy)
router.put("/:id/vacate", protect, adminOrOwner, vacateTenant);

// Record a payment against the current tenancy
router.post("/:id/payment", protect, adminOrOwner, recordPayment);

module.exports = router;
