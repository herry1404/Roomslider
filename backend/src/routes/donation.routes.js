const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");
const upload = require("../middleware/upload.middleware");
const controller = require("../controllers/donation.controller");

const router = express.Router();

router.post("/", protect, upload.array("photos", 4), controller.createDonation);
router.get("/mine", protect, controller.getMyDonations);
router.put("/:id/cancel", protect, controller.cancelDonation);
router.get("/admin", protect, adminOnly, controller.getAdminDonations);
router.put("/admin/:id/status", protect, adminOnly, controller.updateDonationStatus);
router.post("/admin/:id/catalog", protect, adminOnly, controller.addDonationToCatalog);

module.exports = router;
