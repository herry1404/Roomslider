const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");
const controller = require("../controllers/bloodRequest.controller");

const router = express.Router();

router.use(protect);
router.post("/", controller.createBloodRequest);
router.get("/mine", controller.getMyBloodRequests);
router.put("/:id/close", controller.closeMyBloodRequest);
router.get("/admin/pending-count", adminOnly, controller.getPendingCount);
router.get("/admin", adminOnly, controller.getAdminBloodRequests);
router.get("/admin/:id/estimate", adminOnly, controller.estimateRecipients);
router.put("/admin/:id/approve", adminOnly, controller.approveBloodRequest);
router.put("/admin/:id/reject", adminOnly, controller.rejectBloodRequest);
router.post("/admin/:id/broadcast", adminOnly, controller.broadcastBloodRequest);
router.put("/admin/:id/status", adminOnly, controller.updateAdminBloodStatus);
router.put("/admin/users/:userId/requests-block", adminOnly, controller.setRequestBlock);
router.post("/:id/help", controller.helpWithBloodRequest);
router.post("/:id/unavailable", controller.markUnavailable);
router.get("/:id", controller.getBloodRequest);

module.exports = router;
