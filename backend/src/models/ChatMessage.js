const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    sender: {
      type: String,
      enum: ["user", "bot"],
      required: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true } // FIX #1: adds createdAt + updatedAt automatically
);

// FIX #2: compound index for fast per-user message queries
chatMessageSchema.index({ user_id: 1, timestamp: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);