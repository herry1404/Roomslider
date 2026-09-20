const express = require("express");
const router = express.Router();

const {
  register,
  login,
  googleLogin,
  getMyTenancy,
  giveVacateNotice,
  cancelVacateNotice,
  updatePhone,
  updatePreferences
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/auth.middleware");
const authLimiter = require("../middleware/authLimiter");
const registerLimiter = require("../middleware/registerLimiter");


// Register Route
router.post("/register", registerLimiter, register);


// Login Route
router.post("/login", authLimiter, login);


// Google Login Route
router.post("/google", authLimiter, googleLogin);


// Get logged-in user's current tenancy (Tenant Portal)
router.get("/my-tenancy", protect, getMyTenancy);

// Add/update phone number (post-Google-login binding)
router.patch("/update-phone", protect, updatePhone);

// Add/update preferred college and area (onboarding popup)
router.patch("/update-preferences", protect, updatePreferences);

// Give / cancel a vacate notice
router.post("/vacate-notice", protect, giveVacateNotice);
router.delete("/vacate-notice", protect, cancelVacateNotice);


module.exports = router;
