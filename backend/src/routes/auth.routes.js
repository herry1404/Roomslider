const express = require("express");
const router = express.Router();

const {
  register,
  login,
  googleLogin
} = require("../controllers/auth.controller");


// Register Route
router.post("/register", register);


// Login Route
router.post("/login", login);


// Google Login Route
router.post("/google", googleLogin);


module.exports = router;
