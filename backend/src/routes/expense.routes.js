const express = require("express");
const Expense = require("../models/Expense");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth.middleware");
const { sendBudgetOverrunNotification } = require("../utils/budgetNotifier");

const router = express.Router();

/**
 * POST /expenses/add
 */
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { amount, category, date, mode } = req.body;

    if (!amount || !category || !date || !mode) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const expenseDate = new Date(date);
    const monthStart = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1);
    const monthEnd = new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 1);

    const budgetCategoryMap = {
      bills: 'billsUtilities',
    };

    const budgetKey = budgetCategoryMap[category] || category;
    const user = await User.findById(req.user.id).lean();
    const budgetAmount = user?.budgets?.[budgetKey] || 0;

    const priorCategoryTotalResult = await Expense.aggregate([
      { $match: { user_id: req.user.id, category, date: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const priorTotal = priorCategoryTotalResult[0]?.total || 0;
    const expense = await Expense.create({
      user_id: req.user.id,
      amount,
      category,
      date,
      mode
    });

    const newTotal = priorTotal + amount;
    const budgetLabels = {
      food: 'Food',
      transport: 'Transport',
      shopping: 'Shopping',
      entertainment: 'Entertainment',
      billsUtilities: 'Bills & Utilities',
      health: 'Health',
      education: 'Education',
      other: 'Other',
    };
    const categoryLabel = budgetLabels[budgetKey] || category;

    if (budgetAmount > 0 && priorTotal <= budgetAmount && newTotal > budgetAmount) {
      sendBudgetOverrunNotification(user, categoryLabel, budgetAmount, newTotal)
        .catch((sendError) => console.error("Budget overrun email failed:", sendError.message));
    }

    // Update User Balance
    const balanceField = (mode === 'Cash') ? 'balance.cash' : 'balance.account';
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { [balanceField]: -amount }
    });

    res.status(201).json({
      success: true,
      expense
    });
  } catch (err) {
    console.error("Add expense error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * GET /expenses/list
 */
router.get("/list", authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ user_id: req.user.id }).sort({ date: -1 });

    res.json({
      success: true,
      expenses
    });
  } catch (err) {
    console.error("List expenses error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
/**
 * GET /expenses/summary
 */
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { user_id: req.user.id };

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        const parsedStartDate = new Date(`${startDate}T00:00:00.000Z`);

        if (Number.isNaN(parsedStartDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid startDate. Use YYYY-MM-DD format."
          });
        }

        filter.date.$gte = parsedStartDate;
      }

      if (endDate) {
        const parsedEndDate = new Date(`${endDate}T00:00:00.000Z`);

        if (Number.isNaN(parsedEndDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid endDate. Use YYYY-MM-DD format."
          });
        }

        parsedEndDate.setUTCDate(parsedEndDate.getUTCDate() + 1);
        filter.date.$lt = parsedEndDate;
      }
    }

    const expenses = await Expense.find(filter);

    let monthlyTotal = 0;
    let weeklyTotal = 0;
    const byCategory = {};

    expenses.forEach((expense) => {
      monthlyTotal += expense.amount;
      weeklyTotal += expense.amount;

      if (byCategory[expense.category]) {
        byCategory[expense.category] += expense.amount;
      } else {
        byCategory[expense.category] = expense.amount;
      }
    });

    res.json({
      success: true,
      weekly_total: weeklyTotal,
      monthly_total: monthlyTotal,
      by_category: byCategory
    });
  } catch (err) {
    console.error("Expense summary error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});



module.exports = router;
