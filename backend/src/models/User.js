const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  income: { type: Number },
  balance: {
    account: { type: Number, default: 0 },
    cash: { type: Number, default: 0 }
  },
  streak: {
    count: { type: Number, default: 0 },
    lastLogin: { type: Date }
  },
  occupation: { type: String }, // e.g., 'Student', 'Earner'
  incomeRange: { type: String },
  budgets: {
    food: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    shopping: { type: Number, default: 0 },
    entertainment: { type: Number, default: 0 },
    billsUtilities: { type: Number, default: 0 },
    health: { type: Number, default: 0 },
    education: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
