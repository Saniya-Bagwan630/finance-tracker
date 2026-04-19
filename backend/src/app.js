const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");

const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://finance-tracker-beryl-kappa.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean));

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    try {
      if (allowedOrigins.has(origin) || /\.vercel\.app$/i.test(new URL(origin).hostname)) {
        return callback(null, true);
      }
    } catch (error) {
      return callback(new Error("Not allowed by CORS"));
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(apiLimiter);

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
