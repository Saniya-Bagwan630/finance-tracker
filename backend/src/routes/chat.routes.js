const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const authMiddleware = require("../middleware/auth.middleware");
const ChatMessage = require("../models/ChatMessage");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const User = require("../models/User");
const mongoose = require("mongoose");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const router = express.Router();
const CHAT_ROUTE_VERSION = "gemini-2.5-flash-with-local-fallback-v5";
const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

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

const CATEGORY_LABELS = {
  food: "Food",
  transport: "Transport",
  shopping: "Shopping",
  entertainment: "Entertainment",
  bills: "Bills",
  health: "Health",
  education: "Education",
  other: "Other"
};

const CATEGORY_EMOJIS = {
  food: "🍕",
  transport: "🚗",
  shopping: "🛍️",
  entertainment: "🎬",
  bills: "💡",
  health: "💊",
  education: "📚",
  other: "📌"
};

const SAVINGS_TIPS = {
  food: {
    text: "Meal prep on Sundays, cook at home a few more days per week, use grocery lists, and avoid impulse snacks.",
    savingRate: 0.24
  },
  transport: {
    text: "Use public transit where possible, carpool for repeated routes, walk short distances, and combine trips.",
    savingRate: 0.18
  },
  shopping: {
    text: "Use a 24-hour rule before purchases, unsubscribe from promo emails, and keep a wishlist instead of buying immediately.",
    savingRate: 0.25
  },
  entertainment: {
    text: "Share subscriptions, look for free events, rotate streaming services, and set a monthly entertainment cap.",
    savingRate: 0.22
  },
  bills: {
    text: "Review subscriptions, reduce energy use, compare plans, and negotiate recurring rates where possible.",
    savingRate: 0.15
  },
  health: {
    text: "Choose generic medicines when suitable, use preventive care, compare pharmacies, and try home workouts.",
    savingRate: 0.12
  },
  education: {
    text: "Use free online resources, library books, second-hand materials, and study groups before buying new courses.",
    savingRate: 0.14
  },
  other: {
    text: "Track every small expense, split miscellaneous spending into clearer categories, and set a monthly cap.",
    savingRate: 0.2
  }
};

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

function formatCurrency(amount) {
  return `Rs ${Math.round(Number(amount) || 0).toLocaleString("en-IN")}`;
}

function formatPercent(value) {
  const rounded = Number(value).toFixed(1);
  return rounded.endsWith(".0") ? rounded.slice(0, -2) : rounded;
}

function extractAmount(message) {
  const normalized = normalizeText(message);
  const contextMatch = normalized.match(/(?:rs\.?|rupees?|inr|₹)\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:rs\.?|rupees?|inr|₹)/i);
  if (contextMatch) {
    const amount = Number(contextMatch[1] || contextMatch[2]);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  }
  
  const fallbackMatch = normalized.match(/\b(\d+(?:\.\d{1,2})?)\b/);
  if (fallbackMatch) {
    const amount = Number(fallbackMatch[1]);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  }
  return null;
}

function detectExpenseCategory(message) {
  const text = normalizeText(message);
  const hasKeyword = (keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
  };

  const groups = [
    ["food", ["pizza", "burger", "food", "lunch", "dinner", "breakfast", "coffee", "tea", "snack", "restaurant", "cafe", "zomato", "swiggy", "meal", "groceries"]],
    ["transport", ["uber", "ola", "taxi", "cab", "auto", "bus", "train", "metro", "fuel", "petrol", "diesel", "transport", "rickshaw"]],
    ["shopping", ["shopping", "bought", "buy", "clothes", "shirt", "jeans", "shoes", "amazon", "flipkart", "mall", "dress", "watch", "bag", "makeup", "cosmetics", "beauty product"]],
    ["entertainment", ["movie", "cinema", "netflix", "prime", "spotify", "game", "concert", "party", "entertainment", "subscription"]],
    ["bills", ["bill", "bills", "electricity", "wifi", "internet", "rent", "water", "gas", "recharge", "utility", "mobile"]],
    ["health", ["doctor", "medicine", "hospital", "clinic", "pharmacy", "health", "medical", "skincare", "skin care", "sunscreen", "moisturizer", "face wash"]],
    ["education", ["book", "books", "course", "tuition", "class", "college", "school", "stationery", "stationary", "pen", "notebook", "education"]]
  ];

  for (const [category, keywords] of groups) {
    if (keywords.some(hasKeyword)) return category;
  }

  return "other";
}

function detectExpenseMode(message) {
  const text = normalizeText(message);
  if (/\bupi\b|gpay|google pay|phonepe|paytm/.test(text)) return "UPI";
  if (/\bcard\b|credit|debit/.test(text)) return "Card";
  if (/\bcash\b/.test(text)) return "Cash";
  return "UPI";
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

function detectIntent(message) {
  const text = normalizeText(message);
  let intent = "UNKNOWN";
  let confidence = 0.0;
  
  const isQuestion = /\b(how|what|why|should|can|could|would|will|tips?|advice)\b|\?/.test(text);
  const questionPenalty = isQuestion ? 0.4 : 0.0;
  const amount = extractAmount(message);
  const hasAmount = amount !== null;

  // 1. ADD_EXPENSE
  const expenseMatch = text.match(/\b(spent|spend|paid|pay|bought|buy|ordered|expense|cost|costed)\b/);
  if (expenseMatch && hasAmount) {
    let score = 0.8;
    if (/\b(on|for)\b/.test(text)) score += 0.1;
    if (/rs|rupees|inr|₹/.test(text)) score += 0.1;
    score -= questionPenalty;
    if (score > confidence) { confidence = score; intent = "ADD_EXPENSE"; }
  }

  // 2. ADD_INCOME
  const incomeMatch = text.match(/\b(received|got|earned|income|salary|credited|deposit|deposited|bonus|gift)\b/);
  if (incomeMatch && hasAmount) {
    let score = 0.8;
    if (/rs|rupees|inr|₹/.test(text)) score += 0.1;
    score -= questionPenalty;
    if (/\b(spent|paid|bought|expense|cost)\b/.test(text)) score -= 0.5; // Strict separation
    if (score > confidence) { confidence = score; intent = "ADD_INCOME"; }
  }

  // 3. ANALYZE
  const analyzeMatch = text.match(/where.*spend|where.*spent|spend most|spent most|top.*categor|breakdown|analy[sz]e|spending pattern|spending patterns|insight|insights/);
  if (analyzeMatch) {
    let score = 0.85;
    if (isQuestion) score += 0.1; // Questions expected for analysis
    if (score > confidence) { confidence = score; intent = "ANALYZE"; }
  }

  // 4. FINANCIAL_ADVICE
  const adviceMatch = text.match(/financial advice|money advice|budget|budgeting|decrease.*spend|reduce.*spend|cut.*spend|save more|saving|savings|where.*save|invest|investment|debt|emergency fund|overspend|spending habit|plan my money|manage money|personal finance|saving advice|savings advice|how.*save/);
  if (adviceMatch) {
    let score = 0.6; // Keep it low to prefer Gemini
    if (isQuestion) score -= 0.1;
    if (score > confidence) { confidence = score; intent = "FINANCIAL_ADVICE"; }
  }

  // 5. NAVIGATE
  const navTarget = detectNavigationTarget(message);
  if (navTarget) {
    let score = 0.8;
    if (text.length < 30) score += 0.1;
    score -= questionPenalty * 0.5;
    if (score > confidence) { confidence = score; intent = "NAVIGATE"; }
  }

  return { intent, confidence, amount };
}

function detectAnalysisPeriod(message) {
  const text = normalizeText(message);
  const now = new Date();
  let startDate = null;
  let label = "all time";
  let days = null;

  if (/all time|overall|ever|lifetime/.test(text)) {
    return { startDate, endDate: now, label, days };
  }

  if (/this week|weekly|last 7 days|past 7 days/.test(text)) {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate: now, label: "this week", days: 7 };
  }

  if (/this month|monthly/.test(text)) {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate, endDate: now, label: "this month", days: Math.max(1, now.getDate()) };
  }

  startDate = new Date(now);
  startDate.setDate(now.getDate() - 29);
  startDate.setHours(0, 0, 0, 0);
  return { startDate, endDate: now, label: "the last 30 days", days: 30 };
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
    payload.mode = "UPI";
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

async function analyzeSpending(userId, timePeriod = 30, originalMessage = "") {
  const requestedPeriod = typeof timePeriod === "number"
    ? { startDate: null, endDate: new Date(), label: timePeriod === 30 ? "the last 30 days" : `the last ${timePeriod} days`, days: timePeriod }
    : detectAnalysisPeriod(originalMessage);

  const period = originalMessage ? detectAnalysisPeriod(originalMessage) : requestedPeriod;
  const match = { user_id: new mongoose.Types.ObjectId(userId) };

  if (period.startDate) {
    match.date = { $gte: period.startDate, $lte: period.endDate };
  }

  log("Analyzing spending for user:", userId, "period:", period.label, "match:", match);

  const categoryTotals = await Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$category",
        amount: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    },
    { $sort: { amount: -1 } }
  ]);

  if (!categoryTotals.length) {
    return {
      message: `I could not find any expenses for ${period.label}. Try logging a few expenses first, like "spent 200 on books", and I will give you a useful spending breakdown.`,
      action: null
    };
  }

  const totalSpent = categoryTotals.reduce((sum, item) => sum + item.amount, 0);
  const topCategories = categoryTotals.slice(0, 3).map((item) => ({
    category: VALID_EXPENSE_CATEGORIES.includes(item._id) ? item._id : "other",
    amount: item.amount,
    count: item.count,
    percentage: totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0
  }));

  const breakdown = topCategories
    .map((item, index) => {
      const label = CATEGORY_LABELS[item.category] || titleCase(item.category);
      return `${index + 1}. ${label}: ${formatCurrency(item.amount)} (${formatPercent(item.percentage)}% of total)`;
    })
    .join("\n");

  const adviceBlocks = topCategories.map((item) => {
    const label = CATEGORY_LABELS[item.category] || titleCase(item.category);
    const emoji = CATEGORY_EMOJIS[item.category] || CATEGORY_EMOJIS.other;
    const tip = SAVINGS_TIPS[item.category] || SAVINGS_TIPS.other;
    const estimatedSavings = Math.max(100, Math.round((item.amount * tip.savingRate) / 100) * 100);

    return `${emoji} ${label}: You spent ${formatCurrency(item.amount)} here. ${tip.text} This could save you around ${formatCurrency(estimatedSavings)}${period.days ? ` in ${period.label}` : " per month"}.`;
  });

  const totalPotentialSavings = topCategories.reduce((sum, item) => {
    const tip = SAVINGS_TIPS[item.category] || SAVINGS_TIPS.other;
    return sum + Math.max(100, Math.round((item.amount * tip.savingRate) / 100) * 100);
  }, 0);

  const lowerSavings = Math.max(100, Math.round((totalPotentialSavings * 0.8) / 100) * 100);
  const upperSavings = Math.max(lowerSavings, Math.round((totalPotentialSavings * 1.15) / 100) * 100);

  return {
    message:
      `📊 Here's your spending breakdown for ${period.label}:\n\n` +
      `${breakdown}\n\n` +
      `Total tracked spending: ${formatCurrency(totalSpent)}\n\n` +
      `💡 Savings tips for you:\n\n` +
      `${adviceBlocks.join("\n\n")}\n\n` +
      `Total potential savings: ${formatCurrency(lowerSavings)}-${formatCurrency(upperSavings)} ${period.days ? `over ${period.label}` : "per month"}! 🎯\n\n` +
      "Start with the first category this week. Small repeatable cuts beat painful one-time restrictions.",
    action: null
  };
}

// FINANCIAL_ADVICE intent logic is handled in detectIntent function.

async function getFinanceContext(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 29);
  startDate.setHours(0, 0, 0, 0);

  const [user, expenses, incomeAgg, categoryTotals] = await Promise.all([
    User.findById(userId, "name income balance occupation incomeRange budgets budget_margin").lean(),
    Expense.find({ user_id: userId, date: { $gte: startDate, $lte: now } })
      .sort({ date: -1 })
      .limit(12)
      .lean(),
    Income.aggregate([
      { $match: { user_id: userObjectId, date: { $gte: startDate, $lte: now } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    Expense.aggregate([
      { $match: { user_id: userObjectId, date: { $gte: startDate, $lte: now } } },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ])
  ]);

  const totalSpent = categoryTotals.reduce((sum, item) => sum + item.total, 0);
  const totalIncome = incomeAgg[0]?.total || 0;

  return {
    user: user || {},
    periodLabel: "last 30 days",
    totalSpent,
    totalIncome,
    topCategories: categoryTotals.map((item) => ({
      category: CATEGORY_LABELS[item._id] || titleCase(item._id || "other"),
      amount: item.total,
      count: item.count,
      percentage: totalSpent ? Math.round((item.total / totalSpent) * 100) : 0
    })),
    recentExpenses: expenses.map((expense) => ({
      amount: expense.amount,
      category: CATEGORY_LABELS[expense.category] || titleCase(expense.category || "other"),
      mode: expense.mode,
      date: expense.date
    }))
  };
}

function buildLocalAdviceReply(message, context = null) {
  const text = normalizeText(message);
  const top = context?.topCategories?.[0];
  const totalSpent = context?.totalSpent || 0;
  const totalIncome = context?.totalIncome || context?.user?.income || 0;

  if (top) {
    const categoryKey = Object.entries(CATEGORY_LABELS).find(([, label]) => label === top.category)?.[0] || "other";
    const tip = SAVINGS_TIPS[categoryKey] || SAVINGS_TIPS.other;
    const targetCut = Math.max(100, Math.round((top.amount * tip.savingRate) / 100) * 100);
    const incomeLine = totalIncome
      ? `You tracked ${formatCurrency(totalSpent)} spending against about ${formatCurrency(totalIncome)} income in this period. `
      : `You tracked ${formatCurrency(totalSpent)} spending in this period. `;

    return [
      `${incomeLine}Your biggest category is ${top.category} at ${formatCurrency(top.amount)} (${top.percentage}%).`,
      `To reduce spending: ${tip.text}`,
      `Target for this week: cut about ${formatCurrency(targetCut)} from ${top.category}.`,
      "Move that saved amount to a separate savings balance as soon as income arrives, so it does not get spent later."
    ].join("\n");
  }

  if (/invest|investment/.test(text)) {
    return "Start with basics before investing: keep one month of expenses as a starter emergency fund, avoid high-interest debt, then invest only money you will not need soon. For beginners, low-cost diversified funds are usually safer than picking individual stocks. This is general education, not personalized investment advice.";
  }

  if (/debt|loan|credit card/.test(text)) {
    return "For debt, pay minimums on every loan first, then attack the highest-interest balance with any extra money. Avoid adding new debt while doing this, and keep a small emergency buffer so one surprise expense does not force more borrowing.";
  }

  return [
    "Here is a simple financial plan you can start today:",
    "1. Track every expense for 30 days so you know where money is going.",
    "2. Set weekly caps for food, shopping, entertainment, and other flexible spending.",
    "3. Use a 24-hour wait before buying non-essential items.",
    "4. Transfer savings immediately after income arrives, even if the amount is small.",
    "5. Build an emergency fund before taking bigger investment risks."
  ].join("\n");
}

function isUsefulGeminiReply(reply) {
  if (!reply) return false;
  const trimmed = reply.trim();
  if (trimmed.length < 120) return false;
  if (/^hello\b|^hi\b/i.test(trimmed) && trimmed.length < 220) return false;
  return true;
}

async function getGeminiReply(userId, message) {
  if (!process.env.GEMINI_API_KEY) {
    warn("Gemini skipped: GEMINI_API_KEY is not configured");
    return null;
  }

  const context = await getFinanceContext(userId);
  const prompt = [
    "You are the chatbot inside a personal finance tracker for students and first-time earners in India.",
    "Reply directly to the user's question with practical, clear guidance. Do not start with a greeting or the user's name.",
    "Use the user's finance context when useful. Do not invent transactions.",
    "If giving investment or financial advice, keep it educational and avoid guarantees.",
    "For financial advice, give 4 to 6 actionable bullet points with specific next steps.",
    "",
    `User question: ${message}`,
    "",
    "Finance context JSON:",
    JSON.stringify(context, null, 2)
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const url = `${GEMINI_API_BASE_URL}/models/${GEMINI_MODEL_NAME}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  log(`Calling Gemini API model=${GEMINI_MODEL_NAME}`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 650
      }
    })
  }).finally(() => clearTimeout(timeout));

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data?.error?.message || response.statusText || "Gemini API request failed";
    throw new Error(`Gemini ${GEMINI_MODEL_NAME} failed: ${detail}`);
  }

  const reply = (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || "")
    .join("")
    .trim();

  log(`Gemini API answered with ${reply.length} characters`);
  return reply || null;
}

async function handleMessage(userId, message) {
  log("Parsing message with guaranteed local parser:", message);

  const { intent, confidence, amount } = detectIntent(message);
  log(`[INTENT] Detected: ${intent} | Confidence: ${confidence.toFixed(2)}`);

  const CONFIDENCE_THRESHOLD = 0.7;

  if (confidence >= CONFIDENCE_THRESHOLD) {
    if (intent === "ADD_EXPENSE") {
      const payload = buildExpensePayload(message);
      payload.amount = amount || payload.amount;
      await createExpense(userId, payload);
      return {
        message: `Added Rs ${payload.amount} under ${titleCase(payload.category)} using ${payload.mode}.`,
        action: { type: "ADD_EXPENSE", payload },
        source: "local-parser"
      };
    }

    if (intent === "ADD_INCOME") {
      const payload = buildIncomePayload(message);
      payload.amount = amount || payload.amount;
      await createIncome(userId, payload);
      return {
        message: `Logged Rs ${payload.amount} income from ${payload.source} to ${payload.paymentMethod}.`,
        action: { type: "ADD_INCOME", payload },
        source: "local-parser"
      };
    }

    if (intent === "NAVIGATE") {
      const target = detectNavigationTarget(message);
      return {
        message: target === "/goals" ? "Opening your goals page." : "Opening that page for you.",
        action: { type: "NAVIGATE", target },
        source: "local-parser"
      };
    }

    if (intent === "ANALYZE") {
      const analysisReply = await analyzeSpending(userId, 30, message);
      return { ...analysisReply, source: "local-analysis" };
    }
  }

  log(`Falling back to Gemini API... (Intent: ${intent}, Confidence: ${confidence.toFixed(2)})`);

  try {
    let context = null;
    if (intent === "FINANCIAL_ADVICE" || intent === "ANALYZE" || confidence < CONFIDENCE_THRESHOLD) {
      context = await getFinanceContext(userId);
    }
    
    const geminiReply = await getGeminiReply(userId, message);
    if (geminiReply && isUsefulGeminiReply(geminiReply)) {
      return { message: geminiReply, action: null, source: "gemini", model: GEMINI_MODEL_NAME };
    }
  } catch (err) {
    warn("Gemini reply failed:", err.message);
  }

  // Ultimate local fallback
  if (intent === "FINANCIAL_ADVICE" || message.toLowerCase().includes("advice")) {
    try {
      const context = await getFinanceContext(userId);
      return { message: buildLocalAdviceReply(message, context), action: null, source: "local-fallback" };
    } catch (err) {
      warn("Finance context fallback failed, using basic fallback:", err.message);
      return { message: buildLocalAdviceReply(message), action: null, source: "local-fallback" };
    }
  }

  return {
    message: "I can help with expenses, income, budgets, savings, goals, and spending insights. Try: 'spent 200 on pizza', 'received 5000 salary', 'how can I decrease my spending?', or 'where can I save more?'",
    action: null,
    source: "local-fallback"
  };
}

router.get("/debug", authMiddleware, (req, res) => {
  log("GET /chat/debug reached backend");
  res.json({
    success: true,
    routeVersion: CHAT_ROUTE_VERSION,
    userId: req.user.id,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    geminiModel: GEMINI_MODEL_NAME,
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
        source: reply.source || "unknown",
        model: reply.model || null,
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
