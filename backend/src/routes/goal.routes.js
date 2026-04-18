const express = require("express");
const Goal = require("../models/Goal");
const Saving = require("../models/Saving");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();
const VALID_FREQUENCIES = ["daily", "weekly", "monthly"];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getGoalValidationError({ target_amount, deadline, saving_frequency }) {
  const targetAmount = Number(target_amount);
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    return "Target amount must be greater than 0";
  }

  if (!VALID_FREQUENCIES.includes(saving_frequency)) {
    return "Invalid saving frequency";
  }

  const parsedDeadline = new Date(deadline);
  if (Number.isNaN(parsedDeadline.getTime())) {
    return "Invalid deadline";
  }

  parsedDeadline.setHours(0, 0, 0, 0);

  const today = startOfToday();
  if (parsedDeadline < today) {
    return "Deadline cannot be in the past";
  }

  const diffInDays = Math.ceil((parsedDeadline.getTime() - today.getTime()) / MS_PER_DAY);

  if (diffInDays <= 7 && ["weekly", "monthly"].includes(saving_frequency)) {
    return "For deadlines within 7 days, only daily saving frequency is allowed";
  }

  if (diffInDays <= 31 && saving_frequency === "monthly") {
    return "Monthly saving frequency is only allowed when the deadline is more than 1 month away";
  }

  return null;
}

/**
 * POST /goals/create
 */
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { target_amount, deadline, saving_frequency } = req.body;

    if (!target_amount || !deadline || !saving_frequency) {
      return res.status(400).json({
        success: false,
        message: "Missing fields"
      });
    }

    const validationError = getGoalValidationError({
      target_amount,
      deadline,
      saving_frequency
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const normalizedDeadline = new Date(deadline);
    normalizedDeadline.setHours(0, 0, 0, 0);

    const goal = await Goal.create({
      user_id: req.user.id,
      target_amount: Number(target_amount),
      saved_amount: 0,
      deadline: normalizedDeadline,
      saving_frequency
    });

    return res.status(201).json({
      success: true,
      goal
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
 * GET /goals/list
 */
router.get("/list", authMiddleware, async (req, res) => {
  try {
    const goals = await Goal.find({ user_id: req.user.id })
      .sort({ created_at: -1 });

    return res.json({
      success: true,
      goals
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/**
 * GET /goals/progress
 * REAL implementation (no placeholder)
 */
router.get("/progress", authMiddleware, async (req, res) => {
  try {
    // 1️⃣ Get goal (specific or latest)
    let query = { user_id: req.user.id };
    if (req.query.goal_id) {
      query._id = req.query.goal_id;
    }

    const goal = await Goal.findOne(query).sort({ created_at: -1 });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "No goal found"
      });
    }

    // 2️⃣ Aggregate savings for this goal
    const savingsAgg = await Saving.aggregate([
      {
        $match: {
          user_id: goal.user_id,
          goal_id: goal._id
        }
      },
      {
        $group: {
          _id: null,
          totalSaved: { $sum: "$amount" }
        }
      }
    ]);

    const savedSoFar =
      savingsAgg.length > 0 ? savingsAgg[0].totalSaved : 0;

    // 3️⃣ Remaining amount
    const remaining = Math.max(
      goal.target_amount - savedSoFar,
      0
    );

    // 4️⃣ Stable response (DO NOT CHANGE FIELD NAMES)
    return res.json({
      goal_id: goal._id,
      target_amount: goal.target_amount,
      saved_so_far: savedSoFar,
      remaining
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
