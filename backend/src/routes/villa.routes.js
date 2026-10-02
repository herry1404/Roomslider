const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");
const upload = require("../middleware/upload.middleware");
const {
  createVilla,
  getPublicVillas,
  getPublicVilla,
  getAllVillas,
  updateVilla,
  deleteVilla,
} = require("../controllers/villa.controller");

router.get("/public", getPublicVillas);
router.get("/public/:id", getPublicVilla);
router.get("/", protect, adminOnly, getAllVillas);
router.post("/", protect, adminOnly, upload.array("images", 10), createVilla);
router.put("/:id", protect, adminOnly, upload.array("images", 10), updateVilla);
router.delete("/:id", protect, adminOnly, deleteVilla);

module.exports = router;
