const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const ChatMessage = require("../models/ChatMessage");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Expense = require("../models/Expense");
const mongoose = require("mongoose");

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY");

const systemInstruction = `
You are a helpful, empathetic financial assistant for students.
Your goal is to help them manage money, save for goals, and understand spending.

You can perform ACTIONS directly or navigate the app. Always return a JSON object.

=== ACTIONS YOU CAN PERFORM ===

1. ADD_EXPENSE — when user says they spent money on something
   Required fields: amount (number), category (string), mode (string), date (string YYYY-MM-DD)
   Valid categories: food, transport, shopping, entertainment, bills, health, education, other
   Valid modes: Cash, UPI, Card (default: Cash if not specified)
   Date: use today if not specified
   Map user input to closest valid category. e.g. "stationary" → "education", "lunch" → "food", "uber" → "transport", "netflix" → "entertainment"

2. ADD_INCOME — when user says they received money
   Required fields: amount (number), source (string), paymentMethod (string), date (string YYYY-MM-DD)
   Valid paymentMethods: Cash, Account (default: Account if not specified)
   Source: descriptive text e.g. "Freelance", "Salary", "Bonus", "Gift"
   Date: use today if not specified

3. NAVIGATE — when user wants to see a page
   Targets: /goals, /insights/monthly, /expenses/add, /dashboard, /expenses/history

4. ANALYZE_SPENDING — when user asks where they spend most, how to save more, or wants spending breakdown
   No payload needed.

5. null — for general questions, advice, or conversation

=== OUTPUT FORMAT ===
Return ONLY a JSON object, no markdown, no backticks, no explanation outside JSON:
{
  "message": "conversational response",
  "action": { "type": "ACTION_TYPE", "payload": { ... } }
}

Examples:

User: "I spent 200 on stationary"
{ "message": "Got it! Adding ₹200 for Education (stationary) paid in Cash.", "action": { "type": "ADD_EXPENSE", "payload": { "amount": 200, "category": "education", "mode": "Cash", "date": "TODAY" } } }

User: "I received 5000 salary in my account"
{ "message": "Nice! Logging ₹5000 income from Salary to your account.", "action": { "type": "ADD_INCOME", "payload": { "amount": 5000, "source": "Salary", "paymentMethod": "Account", "date": "TODAY" } } }

User: "where have I spent the most?"
{ "message": "Let me check your spending patterns...", "action": { "type": "ANALYZE_SPENDING" } }

User: "how can I save more?"
{ "message": "Let me look at your spending to give you personalised advice.", "action": { "type": "ANALYZE_SPENDING" } }

User: "show me my goals"
{ "message": "Taking you to your goals!", "action": { "type": "NAVIGATE", "target": "/goals" } }

User: "yes" (when previous bot message asked about viewing insights)
{ "message": "Taking you there!", "action": { "type": "NAVIGATE", "target": "/insights/monthly" } }

User: "yes" (when previous bot message asked about viewing expenses)
{ "message": "Taking you there!", "action": { "type": "NAVIGATE", "target": "/expenses/history" } }

If no action needed, set "action" to null.
Replace TODAY with the actual current date in YYYY-MM-DD format.
`;

/**
 * POST /chat/messages
 */
router.post("/messages", authMiddleware, async (req, res) => {
  try {
    const { sender, message } = req.body;

    if (!sender || !message) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    // 1. Save User Message
    const userMsg = await ChatMessage.create({
      user_id: req.user.id,
      sender: "user",
      message
    });

    let botResponseText = "I'm having trouble connecting to my brain right now.";
    let botAction = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const today = new Date().toISOString().split("T")[0];

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: systemInstruction.replace(/TODAY/g, today)
        });

        // Fetch conversation history
        const recentMessages = await ChatMessage.find({ user_id: req.user.id })
          .sort({ timestamp: -1 })
          .limit(10);

        const allMapped = recentMessages
          .reverse()
          .map((msg) => ({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.message }]
          }));

        const firstUserIndex = allMapped.findIndex((m) => m.role === "user");
        const history = firstUserIndex === -1 ? [] : allMapped.slice(firstUserIndex);

        const chat = model.startChat({ history });
        
        const result = await chat.sendMessage(
  `[Today's date is ${today}]\n${message}`
);
        const rawText = result.response.text();

        console.log("Gemini raw response:", rawText);

        const jsonStr = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
          const parsed = JSON.parse(jsonStr);
          botResponseText = parsed.message;
          botAction = parsed.action || null;
        } catch {
          botResponseText = jsonStr;
          botAction = null;
        }

        // Handle ANALYZE_SPENDING server-side with real DB data
        if (botAction && botAction.type === "ANALYZE_SPENDING") {
          try {
            const userObjectId = new mongoose.Types.ObjectId(req.user.id);
            const expenses = await Expense.find({ user_id: userObjectId });

            if (expenses.length === 0) {
              botResponseText = "You don't have any recorded expenses yet. Start logging your spending and I'll give you a full breakdown!";
              botAction = null;
            } else {
              const byCategory = {};
              let total = 0;

              expenses.forEach((e) => {
                byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
                total += e.amount;
              });

              const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
              const top = sorted.slice(0, 3);

              const breakdown = top
                .map(([cat, amt], i) => {
                  const pct = ((amt / total) * 100).toFixed(1);
                  return `${i + 1}. ${cat.charAt(0).toUpperCase() + cat.slice(1)} — ₹${amt} (${pct}%)`;
                })
                .join("\n");

              const topCategory = top[0][0];

const savingTips = {
  food: "• Cook at home instead of eating out\n• Set a weekly food budget\n• Avoid impulse snack purchases",
  transport: "• Use public transport when possible\n• Carpool with friends\n• Walk for short distances",
  shopping: "• Wait 24 hours before buying anything non-essential\n• Unsubscribe from promotional emails\n• Make a list before shopping",
  entertainment: "• Share subscriptions with family or friends\n• Look for free events and activities\n• Set a monthly entertainment cap",
  bills: "• Review subscriptions and cancel unused ones\n• Switch to cheaper mobile/internet plans\n• Turn off lights and save on electricity",
  health: "• Use generic medicines instead of branded ones\n• Prefer government hospitals for routine checkups\n• Stay fit to avoid medical costs",
  education: "• Use free resources like YouTube or Khan Academy\n• Buy second-hand books\n• Share notes and materials with classmates",
  other: "• Track every rupee — awareness reduces spending\n• Set a monthly 'miscellaneous' budget cap\n• Review this category weekly"
};

const tips = savingTips[topCategory] || savingTips.other;
const topCategoryLabel = topCategory.charAt(0).toUpperCase() + topCategory.slice(1);

botResponseText = `Here's where your money is going:\n\n${breakdown}\n\n💡 You're spending the most on ${topCategoryLabel}. Here's how to cut back:\n${tips}\n\nWant to see your full insights page?`;
botAction = { type: "NAVIGATE", target: "/insights/monthly" };
            }
          } catch (analyzeErr) {
            console.error("ANALYZE_SPENDING error:", analyzeErr);
            botResponseText = "I couldn't fetch your spending data right now. Please try again.";
            botAction = null;
          }
        }

      } catch (aiError) {
        console.error("AI Generation Error:", aiError.message);
        console.error("Full AI error:", JSON.stringify(aiError, null, 2));
        botResponseText = "I couldn't process that request fully, but I'm listening.";
      }
    } else {
      // Mock fallback
      if (message.toLowerCase().includes("goal")) {
        botResponseText = "Goals are a great way to save! Taking you there.";
        botAction = { type: "NAVIGATE", target: "/goals" };
      } else {
        botResponseText = "That's interesting! Tell me more about your spending.";
      }
    }

    // Save Bot Message
    const botMsg = await ChatMessage.create({
      user_id: req.user.id,
      sender: "bot",
      message: botResponseText
    });

    return res.status(201).json({
      success: true,
      chatMessage: userMsg,
      reply: {
        message: botResponseText,
        action: botAction,
        timestamp: botMsg.timestamp
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * GET /chat/messages?limit=20
 */
router.get("/messages", authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const messages = await ChatMessage.find({ user_id: req.user.id })
      .sort({ timestamp: -1 })
      .limit(limit);

    return res.json({ success: true, messages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;