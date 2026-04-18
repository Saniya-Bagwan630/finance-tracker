const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const Savings = require("../models/Saving");
const Goal = require("../models/Goal");
const {
  getExpectedContributionPerFrequency,
  getPeriodBounds,
  getPeriodIndex,
  isSameDay,
  startOfDay,
} = require("../utils/goalProgress");

const router = express.Router();

async function getSavingsTotalForRange(goal, periodStart, periodEnd) {
  const result = await Savings.aggregate([
    {
      $match: {
        user_id: goal.user_id,
        goal_id: goal._id,
        date: { $gte: periodStart, $lt: periodEnd },
      },
    },
    {
      $group: {
        _id: null,
        totalSaved: { $sum: "$amount" },
      },
    },
  ]);

  return result[0]?.totalSaved || 0;
}

function isPreviousDailyContribution(lastContributionDate, contributionDate) {
  const lastDate = startOfDay(lastContributionDate);
  const currentDate = startOfDay(contributionDate);
  const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));
  return diffDays === 1;
}

async function updateGoalStreak(goal, contributionDate) {
  if (goal.saving_frequency === "daily") {
    if (!goal.lastContributionDate) {
      goal.streakCount = 1;
    } else if (isSameDay(goal.lastContributionDate, contributionDate)) {
      return goal;
    } else if (isPreviousDailyContribution(goal.lastContributionDate, contributionDate)) {
      goal.streakCount += 1;
    } else {
      goal.streakCount = 1;
    }

    goal.lastContributionDate = contributionDate;
    return goal;
  }

  const expectedPerPeriod = getExpectedContributionPerFrequency(goal);
  const { periodStart, periodEnd, periodIndex } = getPeriodBounds(goal, contributionDate);
  const currentPeriodSaved = await getSavingsTotalForRange(goal, periodStart, periodEnd);

  if (currentPeriodSaved < expectedPerPeriod) {
    return goal;
  }

  const lastContributionDate = goal.lastContributionDate ? new Date(goal.lastContributionDate) : null;
  const lastPeriodIndex = lastContributionDate ? getPeriodIndex(goal, lastContributionDate) : null;

  if (lastContributionDate && lastPeriodIndex === periodIndex) {
    return goal;
  }

  if (lastContributionDate && lastPeriodIndex === periodIndex - 1) {
    goal.streakCount += 1;
  } else {
    goal.streakCount = 1;
  }

  goal.lastContributionDate = contributionDate;
  return goal;
}

router.post("/add", authMiddleware, async (req, res) => {
  try {
    let { amount, date, goal_id } = req.body;

    amount = Number(amount);

    if (!goal_id || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid goal_id and amount are required",
      });
    }

    const goal = await Goal.findOne({
      _id: goal_id,
      user_id: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found for this user",
      });
    }

    const saving = await Savings.create({
      user_id: req.user.id,
      goal_id,
      amount,
      date: date || new Date(),
    });

    goal.saved_amount += amount;
    await updateGoalStreak(goal, new Date(saving.date));
    const updatedGoal = await goal.save();

    const User = require("../models/User");
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "balance.account": -amount },
    });

    return res.status(201).json({
      success: true,
      saving,
      goal: updatedGoal,
    });
  } catch (error) {
    console.error("Add savings error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/list", authMiddleware, async (req, res) => {
  try {
    const savings = await Savings.find({ user_id: req.user.id }).sort({ date: -1 });

    return res.json({
      success: true,
      savings,
    });
  } catch (error) {
    console.error("List savings error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
