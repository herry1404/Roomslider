const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
  getMyProfile,
  getPublicProfile,
  updateMyProfile,
  getDiscover,
  sendRequest,
  getRequests,
  respondToRequest,
  getConnections,
  getConversations,
  markConversationRead,
  getRoommateBadges,
  getChatMessages,
  sendChatMessage,
  cancelRequest,
  blockUser,
  reportUser,
} = require("../controllers/roommate.controller");

const router = express.Router();

router.use(protect);
router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.get("/profiles/:userId", getPublicProfile);
router.get("/chat/:userId", getChatMessages);
router.post("/chat/:userId", sendChatMessage);
router.get("/discover", getDiscover);
router.get("/requests", getRequests);
router.get("/badges", getRoommateBadges);
router.get("/conversations", getConversations);
router.put("/conversations/:id/read", markConversationRead);
router.get("/connections", getConnections);
router.post("/requests/:userId", sendRequest);
router.put("/requests/:id", respondToRequest);
router.delete("/requests/:id", cancelRequest);
router.post("/block/:userId", blockUser);
router.post("/report/:userId", reportUser);

module.exports = router;
