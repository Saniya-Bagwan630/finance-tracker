const app = require("./app");
const connectDB = require("./config/db");
const { startGoalScheduler } = require("./utils/goalScheduler");

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  startGoalScheduler();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
