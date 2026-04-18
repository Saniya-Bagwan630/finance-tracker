const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config({ quiet: true });
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const error = new Error("CORS origin not allowed");
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true,
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use(helmet());
app.use(cors(corsOptions));
app.use(apiLimiter);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});
const authRoutes = require("./routes/auth.routes");
const budgetRoutes = require("./routes/budget.routes");

app.use("/auth", authRoutes);
app.use("/budgets", budgetRoutes);
const authMiddleware = require("./middleware/auth.middleware");

app.get("/protected-test", authMiddleware, (req, res) => {
  res.json({ success: true, userId: req.user.id });
});

const expenseRoutes = require("./routes/expense.routes");
app.use("/expenses", expenseRoutes);

const goalRoutes = require("./routes/goal.routes");
app.use("/goals", goalRoutes);

const savingsRoutes = require("./routes/savings.routes");
app.use("/savings", savingsRoutes);

const chatRoutes = require("./routes/chat.routes");
app.use("/chat", chatRoutes);

const dashboardRoutes = require("./routes/dashboard.routes");
app.use("/dashboard", dashboardRoutes);

const incomeRoutes = require("./routes/income.routes");
app.use("/income", incomeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
