const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const Income = require("../models/Income");

const router = express.Router();

/**
 * POST /income/add
 * Add extra income (Bonus, etc.)
 */
router.post("/add", authMiddleware, async (req, res) => {
    try {
        const { amount, source, date, description } = req.body;

        if (!amount || !source) {
            return res.status(400).json({ success: false, message: "Amount and Source are required" });
        }

        const income = await Income.create({
            user_id: req.user.id,
            amount,
            source,
            date: date || new Date(),
            description,
            paymentMethod: req.body.paymentMethod || 'Account'
        });

        // Update User Balance
        const User = require("../models/User");
        const balanceField = (req.body.paymentMethod === 'Cash') ? 'balance.cash' : 'balance.account';
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { [balanceField]: amount }
        });

        res.status(201).json({
            success: true,
            income
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * GET /income/list
 * List all income entries
 */
router.get("/list", authMiddleware, async (req, res) => {
    try {
        const incomes = await Income.find({ user_id: req.user.id }).sort({ date: -1 });
        res.json({ success: true, incomes });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
