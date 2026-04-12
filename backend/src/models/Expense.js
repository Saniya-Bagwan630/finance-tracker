const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  mode: { type: String, enum: ["manual", "chatbot","UPI","Card","Cash"], required: true }
});

module.exports = mongoose.model("Expense", expenseSchema);
