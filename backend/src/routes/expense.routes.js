const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
  addExpense,
  getMyExpenses,
  deleteExpense,
  getSummary,
  getTransactions,
} = require("../controllers/expense.controller");

router.post("/", protect, addExpense);
router.get("/", protect, getMyExpenses);
router.get("/summary", protect, getSummary);
router.get("/transactions", protect, getTransactions);
router.delete("/:id", protect, deleteExpense);

module.exports = router;
