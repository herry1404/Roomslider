const express = require("express");
const router = express.Router();

const {
  register,
  login,
  googleLogin,
  getMyTenancy
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/auth.middleware");


// Register Route
router.post("/register", register);


// Login Route
router.post("/login", login);


// Google Login Route
router.post("/google", googleLogin);


// Get logged-in user's current tenancy (Tenant Portal)
router.get("/my-tenancy", protect, getMyTenancy);


module.exports = router;
