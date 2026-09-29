const express = require("express");
const router = express.Router();

const {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
} = require("../controllers/furnitureRequest.controller");

const { protect } = require("../middleware/auth.middleware");

router.post("/", protect, createRequest);
router.get("/mine", protect, getMyRequests);
router.get("/", protect, getAllRequests);
router.put("/:id/status", protect, updateRequestStatus);

module.exports = router;
