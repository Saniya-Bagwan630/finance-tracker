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
        .then(() => console.log(`Budget overrun email sent for ${user.email} (${categoryLabel})`))
        .catch((sendError) => console.error(`Failed to send budget overrun email to ${user.email}:`, sendError));
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
    res.status(500).json({ success: false, message: "Server error" });
  }
});
/**
 * GET /expenses/summary
 */
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ user_id: req.user.id });

    let monthlyTotal = 0;
    let weeklyTotal = 0;
    const byCategory = {};

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    expenses.forEach((expense) => {
      // Monthly total (all expenses)
      monthlyTotal += expense.amount;

      // Weekly total (last 7 days)
      if (expense.date >= sevenDaysAgo) {
        weeklyTotal += expense.amount;
      }

      // Category breakdown (monthly)
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
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});



module.exports = router;
