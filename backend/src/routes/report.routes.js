const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { createListingReport } = require("../controllers/trustSafety.controller");

router.post("/listings/:id", protect, createListingReport);

module.exports = router;
