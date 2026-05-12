const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const authMiddleware = require("../middleware/auth.middleware");
const ChatMessage = require("../models/ChatMessage");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const User = require("../models/User");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const router = express.Router();
const CHAT_ROUTE_VERSION = "local-parser-db-writes-v3";

const VALID_EXPENSE_CATEGORIES = [
  "food",
  "transport",
  "shopping",
  "entertainment",
  "bills",
  "health",
  "education",
  "other"
];

const VALID_EXPENSE_MODES = ["Cash", "UPI", "Card"];
const VALID_INCOME_METHODS = ["Cash", "Account"];

const log = (...args) => console.log("[CHAT]", ...args);
const warn = (...args) => console.warn("[CHAT]", ...args);
const error = (...args) => console.error("[CHAT]", ...args);

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[₹,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value = "") {
  return String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function extractAmount(message) {
  const normalized = normalizeText(message);
  const match = normalized.match(/(?:rs\.?|rupees?|inr)?\s*(\d+(?:\.\d{1,2})?)/i);
  if (!match) return null;

  const amount = Number(match[1]);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function detectExpenseCategory(message) {
  const text = normalizeText(message);

  const groups = [
    ["food", ["pizza", "burger", "food", "lunch", "dinner", "breakfast", "coffee", "tea", "snack", "restaurant", "cafe", "zomato", "swiggy", "meal", "groceries"]],
    ["transport", ["uber", "ola", "taxi", "cab", "auto", "bus", "train", "metro", "fuel", "petrol", "diesel", "transport", "rickshaw"]],
    ["shopping", ["shopping", "bought", "buy", "clothes", "shirt", "jeans", "shoes", "amazon", "flipkart", "mall", "dress", "watch", "bag"]],
    ["entertainment", ["movie", "cinema", "netflix", "prime", "spotify", "game", "concert", "party", "entertainment", "subscription"]],
    ["bills", ["bill", "bills", "electricity", "wifi", "internet", "rent", "water", "gas", "recharge", "utility", "mobile"]],
    ["health", ["doctor", "medicine", "hospital", "clinic", "pharmacy", "health", "medical"]],
    ["education", ["book", "books", "course", "tuition", "class", "college", "school", "stationery", "stationary", "pen", "notebook", "education"]]
  ];

  for (const [category, keywords] of groups) {
    if (keywords.some((keyword) => text.includes(keyword))) return category;
  }

  return "other";
}

function detectExpenseMode(message) {
  const text = normalizeText(message);
  if (/\bupi\b|gpay|google pay|phonepe|paytm/.test(text)) return "UPI";
  if (/\bcard\b|credit|debit/.test(text)) return "Card";
  return "Cash";
}

function detectIncomeMethod(message) {
  const text = normalizeText(message);
  if (/\bcash\b/.test(text)) return "Cash";
  return "Account";
}

function detectIncomeSource(message) {
  const text = normalizeText(message);

  if (/\bsalary\b|paycheck|wage/.test(text)) return "Salary";
  if (/freelance|client|project/.test(text)) return "Freelance";
  if (/\bgift\b|gifted/.test(text)) return "Gift";
  if (/\bbonus\b/.test(text)) return "Bonus";
  if (/refund|cashback/.test(text)) return "Refund";
  if (/pocket money|allowance/.test(text)) return "Pocket Money";

  const match = text.match(/\b(?:from|for)\s+([a-z ]+)$/);
  return match ? titleCase(match[1]) : "Income";
}

function isExpenseIntent(message) {
  const text = normalizeText(message);
  return /\b(spent|spend|paid|pay|bought|buy|ordered|expense|cost|costed)\b/.test(text) && extractAmount(message);
}

function isIncomeIntent(message) {
  const text = normalizeText(message);
  return /\b(received|got|earned|income|salary|credited|deposit|deposited|bonus|gift)\b/.test(text) && extractAmount(message);
}

function isAnalyzeIntent(message) {
  const text = normalizeText(message);
  return /spent most|where.*spend|where.*spent|breakdown|analy[sz]e|save more|saving advice|spending pattern|summary/.test(text);
}

function detectNavigationTarget(message) {
  const text = normalizeText(message);

  if (/\bgoal\b|\bgoals\b|saving goals/.test(text)) return "/goals";
  if (/weekly/.test(text)) return "/insights/weekly";
  if (/monthly|insights|analytics|analysis/.test(text)) return "/insights/monthly";
  if (/add expense|new expense/.test(text)) return "/expenses/add";
  if (/history|transactions|past expenses|show expenses|expense list/.test(text)) return "/expenses/history";
  if (/dashboard|home/.test(text)) return "/dashboard";

  return null;
}

function buildExpensePayload(message) {
  return {
    amount: extractAmount(message),
    category: detectExpenseCategory(message),
    mode: detectExpenseMode(message),
    date: todayString()
  };
}

function buildIncomePayload(message) {
  return {
    amount: extractAmount(message),
    source: detectIncomeSource(message),
    paymentMethod: detectIncomeMethod(message),
    date: todayString()
  };
}

async function saveBotMessage(userId, message) {
  return ChatMessage.create({
    user_id: userId,
    sender: "bot",
    message
  });
}

async function createExpense(userId, payload) {
  if (!payload.amount || payload.amount <= 0) {
    throw new Error("Cannot create expense without a valid amount");
  }

  if (!VALID_EXPENSE_CATEGORIES.includes(payload.category)) {
    payload.category = "other";
  }

  if (!VALID_EXPENSE_MODES.includes(payload.mode)) {
    payload.mode = "Cash";
  }

  log("Creating expense in database:", payload);

  const expense = await Expense.create({
    user_id: userId,
    amount: payload.amount,
    category: payload.category,
    mode: payload.mode,
    date: payload.date
  });

  const balanceField = payload.mode === "Cash" ? "balance.cash" : "balance.account";
  await User.findByIdAndUpdate(userId, {
    $inc: { [balanceField]: -payload.amount }
  });

  log("Expense created:", expense._id.toString());
  return expense;
}

async function createIncome(userId, payload) {
  if (!payload.amount || payload.amount <= 0) {
    throw new Error("Cannot create income without a valid amount");
  }

  if (!VALID_INCOME_METHODS.includes(payload.paymentMethod)) {
    payload.paymentMethod = "Account";
  }

  log("Creating income in database:", payload);

  const income = await Income.create({
    user_id: userId,
    amount: payload.amount,
    source: payload.source || "Income",
    paymentMethod: payload.paymentMethod,
    date: payload.date
  });

  const balanceField = payload.paymentMethod === "Cash" ? "balance.cash" : "balance.account";
  await User.findByIdAndUpdate(userId, {
    $inc: { [balanceField]: payload.amount }
  });

  log("Income created:", income._id.toString());
  return income;
}

async function analyzeSpending(userId) {
  log("Analyzing spending for user:", userId);
  const expenses = await Expense.find({ user_id: userId });

  if (!expenses.length) {
    return {
      message: "You do not have any recorded expenses yet. Try saying: spent 200 on pizza.",
      action: null
    };
  }

  const byCategory = {};
  let total = 0;

  expenses.forEach((expense) => {
    byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
    total += expense.amount;
  });

  const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const breakdown = top
    .map(([category, amount], index) => {
      const percent = ((amount / total) * 100).toFixed(1);
      return `${index + 1}. ${titleCase(category)}: ₹${amount} (${percent}%)`;
    })
    .join("\n");

  return {
    message: `Here is your spending breakdown:\n\n${breakdown}\n\nOpening monthly insights so you can review the full chart.`,
    action: { type: "NAVIGATE", target: "/insights/monthly" }
  };
}

async function handleMessage(userId, message) {
  log("Parsing message with guaranteed local parser:", message);

  if (isExpenseIntent(message)) {
    const payload = buildExpensePayload(message);
    await createExpense(userId, payload);
    return {
      message: `Added ₹${payload.amount} under ${titleCase(payload.category)} using ${payload.mode}.`,
      action: { type: "ADD_EXPENSE", payload }
    };
  }

  if (isIncomeIntent(message)) {
    const payload = buildIncomePayload(message);
    await createIncome(userId, payload);
    return {
      message: `Logged ₹${payload.amount} income from ${payload.source} to ${payload.paymentMethod}.`,
      action: { type: "ADD_INCOME", payload }
    };
  }

  if (isAnalyzeIntent(message)) {
    return analyzeSpending(userId);
  }

  const target = detectNavigationTarget(message);
  if (target) {
    return {
      message: target === "/goals" ? "Opening your goals page." : "Opening that page for you.",
      action: { type: "NAVIGATE", target }
    };
  }

  return {
    message: "I can help with expenses, income, goals, and insights. Try: spent 200 on pizza, received 5000 salary, or show my goals.",
    action: null
  };
}

router.get("/debug", authMiddleware, (req, res) => {
  log("GET /chat/debug reached backend");
  res.json({
    success: true,
    routeVersion: CHAT_ROUTE_VERSION,
    userId: req.user.id,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

router.get("/ping", (req, res) => {
  log("GET /chat/ping reached backend");
  res.json({
    success: true,
    routeVersion: CHAT_ROUTE_VERSION,
    message: "Chat route is running from the local parser/database-write implementation.",
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /chat/messages
 */
router.post("/messages", authMiddleware, async (req, res) => {
  const startedAt = Date.now();
  log("POST /chat/messages reached backend");
  log("Request user:", req.user?.id);
  log("Request body:", req.body);

  try {
    const message = String(req.body.message || "").trim();

    if (!message) {
      warn("Empty message rejected");
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    log("Saving user message");
    const userMsg = await ChatMessage.create({
      user_id: req.user.id,
      sender: "user",
      message
    });

    const reply = await handleMessage(req.user.id, message);

    log("Saving bot message");
    const botMsg = await saveBotMessage(req.user.id, reply.message);

    const responseBody = {
      success: true,
      chatMessage: userMsg,
      reply: {
        message: reply.message,
        action: reply.action,
        timestamp: botMsg.timestamp
      },
      debug: {
        routeVersion: CHAT_ROUTE_VERSION,
        durationMs: Date.now() - startedAt
      }
    };

    log("Response:", responseBody.reply);
    return res.status(201).json(responseBody);
  } catch (err) {
    error("Unexpected chat error:", err);

    try {
      const fallbackMessage = "The chatbot route is running, but the requested action hit an internal database error. Check the backend console for the [CHAT] error above.";
      const botMsg = await saveBotMessage(req.user.id, fallbackMessage);

      return res.status(200).json({
        success: true,
        reply: {
          message: fallbackMessage,
          action: null,
          timestamp: botMsg.timestamp
        },
        debug: {
          routeVersion: CHAT_ROUTE_VERSION,
          error: err.message,
          durationMs: Date.now() - startedAt
        }
      });
    } catch (fallbackErr) {
      error("Fallback response also failed:", fallbackErr);
      return res.status(500).json({
        success: false,
        message: "Chat route failed before fallback could be saved",
        error: fallbackErr.message
      });
    }
  }
});

/**
 * GET /chat/messages?limit=20
 */
router.get("/messages", authMiddleware, async (req, res) => {
  log("GET /chat/messages reached backend");

  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const messages = await ChatMessage.find({ user_id: req.user.id })
      .sort({ timestamp: -1 })
      .limit(limit);

    return res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    error("Chat history error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
