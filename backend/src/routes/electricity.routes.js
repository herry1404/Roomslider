const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
  setRate,
  bulkUpdateUnits,
  getMyElectricitySetup,
  getMyBill,
  markBillPaid,
} = require("../controllers/electricity.controller");

// ===== OWNER ROUTES =====

// Set the owner's per-unit electricity rate
router.put("/rate", protect, setRate);

// Get owner's rooms + current month's bills (for the bulk-update page)
router.get("/my-setup", protect, getMyElectricitySetup);

// Bulk update units for all rooms in one go
router.post("/bulk-update", protect, bulkUpdateUnits);

// Mark a specific bill as paid
router.put("/:id/mark-paid", protect, markBillPaid);

// ===== TENANT ROUTE =====

// Get the logged-in tenant's latest electricity bill
router.get("/my-bill", protect, getMyBill);

module.exports = router;
