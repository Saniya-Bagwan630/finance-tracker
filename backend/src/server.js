const app = require("./app");
const connectDB = require("./config/db");
const { startGoalScheduler } = require("./utils/goalScheduler");

const PORT = process.env.PORT || 5000;

// ===== GLOBAL ERROR HANDLING =====
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error.message);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error.message);
  process.exit(1);
});

// ===== START SERVER =====
async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    await connectDB();
    startGoalScheduler();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();