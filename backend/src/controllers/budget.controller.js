const User = require("../models/User");

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

async function getBudgets(req, res) {
  try {
    const user = await User.findById(req.user.id, "budgets");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, budgets: user.budgets });
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

    user.budgets = {
      ...user.budgets.toObject(),
      ...updatedBudgets,
    };

    await user.save();

    res.json({ success: true, budgets: user.budgets });
  } catch (err) {
    console.error("Update budgets error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
  getBudgets,
  updateBudgets,
};
