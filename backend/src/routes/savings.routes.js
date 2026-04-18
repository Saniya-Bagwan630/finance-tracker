const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const Savings = require("../models/Saving");
const Goal = require("../models/Goal");

const router = express.Router();

/**
 * POST /savings/add
 */
router.post("/add", authMiddleware, async (req, res) => {
  try {
    let { amount, date, goal_id } = req.body;

    // ✅ Convert amount to number
    amount = Number(amount);

    // ✅ Validation
    if (!goal_id || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid goal_id and amount are required"
      });
    }

    // ✅ Check goal ownership
    const goal = await Goal.findOne({
      _id: goal_id,
      user_id: req.user.id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found for this user"
      });
    }

    // ✅ Create saving
    const saving = await Savings.create({
      user_id: req.user.id,
      goal_id,
      amount,
      date: date || new Date()
    });

    // ✅ Update saved_amount
    const updatedGoal = await Goal.findByIdAndUpdate(
      goal_id,
      { $inc: { saved_amount: amount } },
      { new: true }
    );

    // ✅ Deduct from user balance
    const User = require("../models/User");
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "balance.account": -amount }
    });

    return res.status(201).json({
      success: true,
      saving,
      goal: updatedGoal   // 🔥 send updated goal
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/**
 * GET /savings/list
 */
router.get("/list", authMiddleware, async (req, res) => {
  try {
    const savings = await Savings.find({ user_id: req.user.id })
      .sort({ date: -1 });

    return res.json({
      success: true,
      savings
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;