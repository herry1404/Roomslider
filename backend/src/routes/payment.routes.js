const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { createOrder, verifyPayment, createMessOrder, verifyMessOrder } = require("../controllers/payment.controller");

router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.post("/mess/create-order", protect, createMessOrder);
router.post("/mess/verify", protect, verifyMessOrder);

module.exports = router;
