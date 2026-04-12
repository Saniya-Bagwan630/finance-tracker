const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});
const authRoutes = require("./routes/auth.routes");

app.use("/auth", authRoutes);
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


module.exports = app;
