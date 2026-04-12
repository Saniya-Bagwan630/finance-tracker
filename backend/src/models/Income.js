const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    source: { type: String, required: true }, // e.g., "Bonus", "Freelance", "Gift"
    date: { type: Date, default: Date.now },
    description: { type: String },
    paymentMethod: { type: String, enum: ['Cash', 'Account'], default: 'Account' }
});

module.exports = mongoose.model("Income", incomeSchema);
