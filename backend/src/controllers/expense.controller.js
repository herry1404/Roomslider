const Expense = require("../models/Expense");
const Room = require("../models/room.model");

// ============================
// Add a new expense
// ============================
const addExpense = async (req, res) => {
  try {
    const { title, category, amount, date, notes, roomId } = req.body;

    if (!title || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Title and a valid amount are required",
      });
    }

    if (roomId) {
      const room = await Room.findOne({ _id: roomId, owner: req.user._id });
      if (!room) {
        return res.status(403).json({
          success: false,
          message: "That room does not belong to you",
        });
      }
    }

    const expense = await Expense.create({
      owner: req.user._id,
      room: roomId || null,
      title,
      category: category || "other",
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      notes: notes || "",
    });

    res.status(201).json({
      success: true,
      message: "Expense added",
      expense,
    });
  } catch (error) {
    console.error("ADD EXPENSE ERROR 👉", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================
// Get owner's expenses, optionally filtered by month/year
// ============================
const getMyExpenses = async (req, res) => {
  try {
    const filter = { owner: req.user._id };

    if (req.query.month && req.query.year) {
      const month = Number(req.query.month);
      const year = Number(req.query.year);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.date = { $gte: start, $lt: end };
    }

    const expenses = await Expense.find(filter)
      .populate("room", "title roomNumber")
      .sort({ date: -1 });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.status(200).json({
      success: true,
      expenses,
      totalExpenses,
    });
  } catch (error) {
    console.error("GET EXPENSES ERROR 👉", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================
// Delete an expense
// ============================
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, owner: req.user._id });

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    await expense.deleteOne();

    res.status(200).json({ success: true, message: "Expense deleted" });
  } catch (error) {
    console.error("DELETE EXPENSE ERROR 👉", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================
// Get profit/loss summary for a given month:
// income = sum of rent payments recorded this month across all rooms,
// expenses = sum of expenses this month, profit = income - expenses.
// ============================
const getSummary = async (req, res) => {
  try {
    const now = new Date();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    // Income: sum of all payments recorded in this window, across this
    // owner's rooms (payments live inside occupancyHistory entries).
    const rooms = await Room.find({ owner: req.user._id });

    let totalIncome = 0;
    rooms.forEach((room) => {
      room.occupancyHistory.forEach((entry) => {
        (entry.payments || []).forEach((p) => {
          const paidDate = new Date(p.date);
          if (paidDate >= start && paidDate < end) {
            totalIncome += p.amount;
          }
        });
      });
    });

    const expenses = await Expense.find({
      owner: req.user._id,
      date: { $gte: start, $lt: end },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.status(200).json({
      success: true,
      month,
      year,
      totalIncome,
      totalExpenses,
      profit: totalIncome - totalExpenses,
    });
  } catch (error) {
    console.error("GET SUMMARY ERROR 👉", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addExpense,
  getMyExpenses,
  deleteExpense,
  getSummary,
};
