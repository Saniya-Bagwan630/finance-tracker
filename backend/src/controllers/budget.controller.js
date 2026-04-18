const User = require("../models/User");
const Income = require("../models/Income");

const ALLOWED_BUDGET_CATEGORIES = [
  "food",
  "transport",
  "shopping",
  "entertainment",
  "billsUtilities",
  "health",
  "education",
  "other",
];

function sanitizeBudgets(payload) {
  const budgets = {};

  ALLOWED_BUDGET_CATEGORIES.forEach((category) => {
    if (Object.prototype.hasOwnProperty.call(payload, category)) {
      const value = Number(payload[category]);
      if (!Number.isNaN(value) && value >= 0) {
        budgets[category] = value;
      }
    }
  });

  return budgets;
}

async function getBudgetIncomeDetails(user) {
  const incomeAgg = await Income.aggregate([
    { $match: { user_id: user._id } },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$amount" }
      }
    }
  ]);

  const totalIncome = incomeAgg[0]?.totalIncome || Number(user.income) || 0;
  return {
    totalIncome,
    usableIncome: totalIncome * 0.85,
    margin: totalIncome * 0.15
  };
}

function getBudgetSum(budgets = {}) {
  return ALLOWED_BUDGET_CATEGORIES.reduce((sum, category) => {
    return sum + (Number(budgets[category]) || 0);
  }, 0);
}

async function getBudgets(req, res) {
  try {
    const user = await User.findById(req.user.id, "budgets income budget_margin");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { usableIncome, margin } = await getBudgetIncomeDetails(user);

    if (user.budget_margin !== margin) {
      user.budget_margin = margin;
      await user.save();
    }

    res.json({
      success: true,
      budgets: user.budgets,
      usableIncome,
      margin: user.budget_margin
    });
  } catch (err) {
    console.error("Get budgets error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function updateBudgets(req, res) {
  try {
    const updatedBudgets = sanitizeBudgets(req.body);

    if (Object.keys(updatedBudgets).length === 0) {
      return res.status(400).json({ success: false, message: "No valid budget updates provided" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const nextBudgets = {
      ...user.budgets.toObject(),
      ...updatedBudgets,
    };
    const { usableIncome, margin } = await getBudgetIncomeDetails(user);
    const totalBudget = getBudgetSum(nextBudgets);

    if (totalBudget > usableIncome) {
      return res.status(400).json({
        success: false,
        message: `Total category budgets cannot exceed usable income of ${usableIncome.toFixed(2)}`
      });
    }

    user.budgets = nextBudgets;
    user.budget_margin = margin;

    await user.save();

    res.json({
      success: true,
      budgets: user.budgets,
      usableIncome,
      margin: user.budget_margin
    });
  } catch (err) {
    console.error("Update budgets error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
  getBudgets,
  updateBudgets,
};
