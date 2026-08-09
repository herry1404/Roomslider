const express = require("express");
const router = express.Router();

const {
  register,
  login,
  googleLogin,
  getMyTenancy,
  giveVacateNotice,
  cancelVacateNotice
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/auth.middleware");
const authLimiter = require("../middleware/authLimiter");


// Register Route
router.post("/register", register);


// Login Route
router.post("/login", authLimiter, login);


// Google Login Route
router.post("/google", authLimiter, googleLogin);


// Get logged-in user's current tenancy (Tenant Portal)
router.get("/my-tenancy", protect, getMyTenancy);

// Give / cancel a vacate notice
router.post("/vacate-notice", protect, giveVacateNotice);
router.delete("/vacate-notice", protect, cancelVacateNotice);


module.exports = router;
