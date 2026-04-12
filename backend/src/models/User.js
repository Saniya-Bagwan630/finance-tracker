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
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
