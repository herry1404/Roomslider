const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
  addExpense,
  getMyExpenses,
  deleteExpense,
  getSummary,
} = require("../controllers/expense.controller");

router.post("/", protect, addExpense);
router.get("/", protect, getMyExpenses);
router.get("/summary", protect, getSummary);
router.delete("/:id", protect, deleteExpense);

module.exports = router;
