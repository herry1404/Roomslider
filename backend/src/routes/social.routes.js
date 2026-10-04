const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");
const controller = require("../controllers/social.controller");

const router = express.Router();

router.get("/", controller.listPlaces);
router.get("/admin/all", protect, adminOnly, controller.listAllPlaces);
router.get("/admin/suggestions", protect, adminOnly, controller.listSuggestions);
router.get("/admin/:id", protect, adminOnly, controller.getAdminPlace);
router.post("/admin/suggestions/:id/:action", protect, adminOnly, controller.reviewSuggestion);
router.post("/suggest", protect, controller.suggestPlace);
router.post("/", protect, adminOnly, controller.createPlace);
router.put("/:id", protect, adminOnly, controller.updatePlace);
router.delete("/:id", protect, adminOnly, controller.deletePlace);
router.get("/:slug", controller.getPlace);

module.exports = router;
