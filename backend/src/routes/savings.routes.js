const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const Savings = require("../models/Saving");
const Goal = require("../models/Goal");

const router = express.Router();

/**
 * POST /savings/add
 * Adds a savings entry linked to a goal
 */
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { amount, date, goal_id } = req.body;

    // 1️⃣ Strict validation
    if (!goal_id || !amount) {
      return res.status(400).json({
        success: false,
        message: "goal_id and amount are required"
      });
    }

    // 2️⃣ Ensure goal exists & belongs to user
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

    // 3️⃣ Create saving entry
    const saving = await Savings.create({
      user_id: req.user.id,
      goal_id: goal_id,
      amount,
      date: date || new Date()
    });

    // 4️⃣ Update Goal Progress
    await Goal.findByIdAndUpdate(goal_id, {
      $inc: { saved_amount: amount }
    });

    // 5️⃣ Deduct from User Account Balance (Assuming savings are transferred from account)
    const User = require("../models/User");
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "balance.account": -amount }
    });

    res.status(201).json({
      success: true,
      saving
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
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

    res.json({
      success: true,
      savings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
