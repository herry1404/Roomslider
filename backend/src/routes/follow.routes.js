const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { followOwner, unfollowOwner } = require("../controllers/follow.controller");

const router = express.Router();

router.post("/:ownerId", protect, followOwner);
router.delete("/:ownerId", protect, unfollowOwner);

module.exports = router;
