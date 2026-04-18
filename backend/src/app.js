const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");

const app = express();

// ===== CORS SETUP =====
const allowedOrigins = [
  "http://localhost:5173", // local frontend
  process.env.FRONTEND_URL // deployed frontend
].filter(Boolean);
const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      origin.includes(".vercel.app") ||
      origin === "http://localhost:5173"
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

// 🔥 IMPORTANT: handle CORS + preflight
app.use(cors({
  origin: true,       // reflect the request origin
  credentials: true,
}));
app.options("/*", cors(corsOptions));

// ===== SECURITY =====
app.use(helmet());

// ===== RATE LIMIT =====
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(apiLimiter);

// ===== BODY PARSER =====
app.use(express.json());

// ===== HEALTH CHECK =====
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// ===== ROUTES =====
const authRoutes = require("./routes/auth.routes");
const budgetRoutes = require("./routes/budget.routes");
const expenseRoutes = require("./routes/expense.routes");
const goalRoutes = require("./routes/goal.routes");
const savingsRoutes = require("./routes/savings.routes");
const chatRoutes = require("./routes/chat.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const incomeRoutes = require("./routes/income.routes");

app.use("/auth", authRoutes);
app.use("/budgets", budgetRoutes);
app.use("/expenses", expenseRoutes);
app.use("/goals", goalRoutes);
app.use("/savings", savingsRoutes);
app.use("/chat", chatRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/income", incomeRoutes);

// ===== TEST PROTECTED ROUTE =====
const authMiddleware = require("./middleware/auth.middleware");
app.get("/protected-test", authMiddleware, (req, res) => {
  res.json({ success: true, userId: req.user.id });
});

// ===== ERROR HANDLING =====
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;