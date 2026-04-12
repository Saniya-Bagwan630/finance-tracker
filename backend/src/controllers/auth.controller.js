const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const DEFAULT_BUDGET_PERCENTAGES = {
  food: 0.15,
  transport: 0.1,
  shopping: 0.1,
  entertainment: 0.08,
  billsUtilities: 0.2,
  health: 0.07,
  education: 0.1,
  other: 0.2,
};

function buildDefaultBudgets(income) {
  const budgetIncome = Number(income) || 0;
  return Object.keys(DEFAULT_BUDGET_PERCENTAGES).reduce((acc, category) => {
    acc[category] = Math.round(budgetIncome * DEFAULT_BUDGET_PERCENTAGES[category]);
    return acc;
  }, {});
}

async function registerUser(req, res) {
  try {
    const { name, email, password, income } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const initialBudgets = buildDefaultBudgets(income);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      income,
      budgets: initialBudgets,
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const emailPayload = {
      to: user.email,
      subject: "Welcome to Finance Tracker 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Welcome to Finance Tracker, ${user.name}!</h2>
          <p>We're excited to have you on board.</p>
          <p>With Finance Tracker, you can:</p>
          <ul>
            <li>Track expenses effortlessly</li>
            <li>Set financial goals and stay on target</li>
            <li>Manage budgets and receive alerts</li>
            <li>See your progress with helpful insights</li>
          </ul>
          <p>Start exploring your dashboard and gain more control over your money.</p>
          <p>Happy budgeting!<br/>The Finance Tracker Team</p>
        </div>
      `,
      text: `Welcome to Finance Tracker, ${user.name}!\n\n` +
            `We're excited to have you on board. Use Finance Tracker to track expenses, set goals, manage budgets, and view helpful insights.\n\n` +
            `Happy budgeting!\nFinance Tracker Team`,
    };

    sendEmail(emailPayload)
      .then(() => console.log(`Welcome email queued for ${user.email}`))
      .catch((sendError) => console.error(`Welcome email failed for ${user.email}:`, sendError));

    res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        streak: { count: 1, lastLogin: new Date() },
        balance: user.balance,
        budgets: user.budgets,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const now = new Date();
    const lastLogin = user.streak?.lastLogin ? new Date(user.streak.lastLogin) : null;
    let newStreak = user.streak?.count || 0;

    if (lastLogin) {
      const diffTime = Math.abs(now - lastLogin);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    user.streak = { count: newStreak, lastLogin: now };
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        streak: user.streak,
        balance: user.balance,
        occupation: user.occupation,
        budgets: user.budgets,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function updateUser(req, res) {
  try {
    const { occupation, incomeRange } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { occupation, incomeRange },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
  registerUser,
  loginUser,
  updateUser,
};
