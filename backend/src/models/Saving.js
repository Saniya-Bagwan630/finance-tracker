const mongoose = require("mongoose");

const savingSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    goal_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 1
    },

    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Saving", savingSchema);
