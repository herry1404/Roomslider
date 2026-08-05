const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");

const {
  getDashboard,
  getAllUsers,
  deleteUser,
} = require("../controllers/admin.controller");

// ===============================
// Dashboard
// ===============================

router.get(
  "/dashboard",
  protect,
  adminOnly,
  getDashboard
);

// ===============================
// Get All Users
// ===============================

router.get(
  "/users",
  protect,
  adminOnly,
  getAllUsers
);

// ===============================
// Delete User
// ===============================

router.delete(
  "/users/:id",
  protect,
  adminOnly,
  deleteUser
);

module.exports = router;