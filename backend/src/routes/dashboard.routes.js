const express = require("express");
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/auth.middleware");
const Expense = require("../models/Expense");
const Goal = require("../models/Goal");
const Saving = require("../models/Saving");
const Income = require("../models/Income");

const router = express.Router();

router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);

    // Total expenses
    const expenseAgg = await Expense.aggregate([
      { $match: { user_id: userObjectId } },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" }
        }
      }
    ]);

    // Total savings
    const savingsAgg = await Saving.aggregate([
      { $match: { user_id: userObjectId } },
      {
        $group: {
          _id: null,
          totalSaved: { $sum: "$amount" }
        }
      }
    ]);

    // Total income
    const incomeAgg = await Income.aggregate([
      { $match: { user_id: userObjectId } },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$amount" }
        }
      }
    ]);

    // Active goal
    const goal = await Goal.findOne({ user_id: userObjectId })
      .sort({ created_at: -1 });

    // User Balance
    const User = require("../models/User");
    const user = await User.findById(userObjectId, 'balance');

    return res.json({
      success: true,
      balance: user?.balance || { account: 0, cash: 0 },
      total_expense: expenseAgg.length ? expenseAgg[0].totalExpense : 0,
      total_income: incomeAgg.length ? incomeAgg[0].totalIncome : 0,
      total_saved: savingsAgg.length ? savingsAgg[0].totalSaved : 0,
      active_goal: goal
        ? {
          goal_id: goal._id,
          target_amount: goal.target_amount,
          deadline: goal.deadline
        }
        : null
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
