const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const uploadMaintenance = require("../middleware/uploadMaintenance.middleware");
const {
  createRequest,
  getMyRequests,
  getOwnerRequests,
  updateRequestStatus,
} = require("../controllers/maintenance.controller");

router.post("/", protect, uploadMaintenance.single("photo"), createRequest);
router.get("/my-requests", protect, getMyRequests);
router.get("/owner-requests", protect, getOwnerRequests);
router.put("/:id/status", protect, updateRequestStatus);

module.exports = router;
