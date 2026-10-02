const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
  getMyProfile,
  updateMyProfile,
  getDiscover,
  sendRequest,
  getRequests,
  respondToRequest,
  getConnections,
  blockUser,
  reportUser,
} = require("../controllers/roommate.controller");

const router = express.Router();

router.use(protect);
router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.get("/discover", getDiscover);
router.get("/requests", getRequests);
router.get("/connections", getConnections);
router.post("/requests/:userId", sendRequest);
router.put("/requests/:id", respondToRequest);
router.post("/block/:userId", blockUser);
router.post("/report/:userId", reportUser);

module.exports = router;
