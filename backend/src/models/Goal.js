const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  goal_name: { type: String, default: "Savings Goal", trim: true },

  target_amount: { type: Number, required: true },

  saved_amount: { 
    type: Number, 
    default: 0  
  },

  deadline: { type: Date, required: true },

  saving_frequency: { 
    type: String, 
    enum: ["daily", "weekly", "monthly"], 
    required: true 
  },

  streakCount: {
    type: Number,
    default: 0
  },

  lastContributionDate: {
    type: Date
  },

  lastMissedReminderSentAt: {
    type: Date
  },

  lastDeadlineReminderSentAt: {
    type: Date
  },

  deadlineResultSentAt: {
    type: Date
  },

  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Goal", goalSchema);
