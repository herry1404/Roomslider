const express = require("express");

const router = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  updateAvatar,
} = require("../controllers/user.controller");

const { protect } = require("../middleware/auth.middleware");
const uploadAvatar = require("../middleware/uploadAvatar.middleware");

router.get("/me", protect, getMyProfile);

router.put("/me", protect, updateMyProfile);

router.put("/me/avatar", protect, uploadAvatar.single("avatar"), updateAvatar);

module.exports = router;
