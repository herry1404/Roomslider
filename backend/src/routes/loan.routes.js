const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");
const uploadLoan = require("../middleware/uploadLoan.middleware");
const {
  createLoanRequest,
  getMyLoanRequest,
  getAllLoanRequests,
  updateLoanStatus,
} = require("../controllers/loan.controller");

router.post("/", protect, uploadLoan.single("idPhoto"), createLoanRequest);
router.get("/mine", protect, getMyLoanRequest);
router.get("/", protect, getAllLoanRequests);
router.put("/:id/status", protect, adminOnly, updateLoanStatus);

module.exports = router;
