import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const ChatContext = createContext(null);
const STALE_CHAT_FALLBACK = "I couldn't process that request fully, but I'm listening.";

const getToday = () => new Date().toISOString().split("T")[0];

const normalizeText = (text) =>
  text
    .toLowerCase()
    .replace(/[₹,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractAmount = (text) => {
  const match = normalizeText(text).match(/(?:rs\.?|rupees?|inr)?\s*(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;

  const amount = Number(match[1]);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const detectCategory = (text) => {
  const normalized = normalizeText(text);
  const hasKeyword = (keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(normalized);
  };

  if (["pizza", "burger", "food", "lunch", "dinner", "breakfast", "coffee", "tea", "snack", "restaurant", "cafe", "zomato", "swiggy", "meal", "groceries"].some(hasKeyword)) return "food";
  if (["uber", "ola", "taxi", "cab", "auto", "bus", "train", "metro", "fuel", "petrol", "diesel", "transport", "rickshaw"].some(hasKeyword)) return "transport";
  if (["shopping", "bought", "buy", "clothes", "shirt", "jeans", "shoes", "amazon", "flipkart", "mall", "dress", "watch", "bag", "makeup", "cosmetics", "beauty product"].some(hasKeyword)) return "shopping";
  if (["movie", "cinema", "netflix", "prime", "spotify", "game", "concert", "party", "entertainment", "subscription"].some(hasKeyword)) return "entertainment";
  if (["bill", "bills", "electricity", "wifi", "internet", "rent", "water", "gas", "recharge", "utility", "mobile"].some(hasKeyword)) return "bills";
  if (["doctor", "medicine", "hospital", "clinic", "pharmacy", "health", "medical", "skincare", "skin care", "sunscreen", "moisturizer", "face wash"].some(hasKeyword)) return "health";
  if (["book", "books", "course", "tuition", "class", "college", "school", "stationery", "stationary", "pen", "notebook", "education"].some(hasKeyword)) return "education";

  return "other";
};

const detectExpenseMode = (text) => {
  const normalized = normalizeText(text);
  if (/\bupi\b|gpay|google pay|phonepe|paytm/.test(normalized)) return "UPI";
  if (/\bcard\b|credit|debit/.test(normalized)) return "Card";
  if (/\bcash\b/.test(normalized)) return "Cash";
  return "UPI";
};

const detectIncomeSource = (text) => {
  const normalized = normalizeText(text);
  if (/\bsalary\b|paycheck|wage/.test(normalized)) return "Salary";
  if (/freelance|client|project/.test(normalized)) return "Freelance";
  if (/\bgift\b|gifted/.test(normalized)) return "Gift";
  if (/\bbonus\b/.test(normalized)) return "Bonus";
  if (/refund|cashback/.test(normalized)) return "Refund";
  return "Income";
};

const detectIncomeMethod = (text) => (/\bcash\b/.test(normalizeText(text)) ? "Cash" : "Account");

const buildBasicFinanceReply = (text) => {
  const normalized = normalizeText(text);

  if (/decrease.*spend|reduce.*spend|cut.*spend|save more|where.*save|saving|savings|budget|financial advice|manage money/.test(normalized)) {
    return [
      "Here is a basic plan while the AI service is unreachable:",
      "1. Track every expense for 30 days.",
      "2. Cut the biggest flexible category first, usually food, shopping, or entertainment.",
      "3. Set a weekly spending cap and stop spending in that category once the cap is reached.",
      "4. Cancel unused subscriptions and wait 24 hours before non-essential purchases.",
      "5. Move savings aside as soon as income arrives."
    ].join("\n");
  }

  if (/invest|investment/.test(normalized)) {
    return "Before investing, build an emergency fund and clear high-interest debt. Then learn about low-cost diversified options and invest only money you will not need soon. This is general education, not guaranteed financial advice.";
  }

  if (/debt|loan|credit card/.test(normalized)) {
    return "Pay minimums on every debt, then put extra money toward the highest-interest balance first. Avoid new borrowing while you do this and keep a small emergency buffer.";
  }

  return "I can help with expenses, income, budgets, savings, goals, and insights. Try: spent 200 on pizza, received 5000 salary, how can I decrease my spending, or where can I save more?";
};

const buildClientFallbackAction = (text) => {
  const normalized = normalizeText(text);
  const amount = extractAmount(text);

  if (amount && /\b(spent|spend|paid|pay|bought|buy|ordered|expense|cost|costed)\b/.test(normalized)) {
    return {
      type: "ADD_EXPENSE",
      payload: {
        amount,
        category: detectCategory(text),
        mode: detectExpenseMode(text),
        date: getToday()
      }
    };
  }

  if (amount && /\b(received|got|earned|income|salary|credited|deposit|deposited|bonus|gift)\b/.test(normalized)) {
    return {
      type: "ADD_INCOME",
      payload: {
        amount,
        source: detectIncomeSource(text),
        paymentMethod: detectIncomeMethod(text),
        date: getToday()
      }
    };
  }

  if (/\bgoal\b|\bgoals\b/.test(normalized)) {
    return { type: "NAVIGATE", target: "/goals" };
  }

  if (/insight|analy|summary|spending/.test(normalized)) {
    return { type: "NAVIGATE", target: "/insights/monthly" };
  }

  return null;
};

export function ChatProvider({ children }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your AI finance assistant 😊 I can add expenses, log income, analyze your spending, and more. Just tell me what you need!", sender: "bot" }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Stores the last spending analysis response so other pages can read it
  const [lastAnalysis, setLastAnalysis] = useState(null);

  const addMessage = (text, sender) => {
    setMessages((prev) => [...prev, { text, sender }]);
  };

  const handleAction = async (action, botText) => {
    if (!action) return;

    switch (action.type) {

      case "ADD_EXPENSE": {
        try {
          const { amount, category, mode, date } = action.payload;
          // The chat backend creates the expense before returning this action.
          addMessage(`✅ Expense of ₹${amount} added under ${category.charAt(0).toUpperCase() + category.slice(1)}!`, "bot");
        } catch (err) {
          addMessage("❌ Couldn't add the expense. Please try again.", "bot");
        }
        break;
      }

      case "ADD_INCOME": {
        try {
          const { amount, source, paymentMethod, date } = action.payload;
          // The chat backend creates the income record before returning this action.
          addMessage(`✅ Income of ₹${amount} from ${source} logged successfully!`, "bot");
        } catch (err) {
          addMessage("❌ Couldn't log the income. Please try again.", "bot");
        }
        break;
      }

      case "NAVIGATE": {
        if (action.target) {
          setTimeout(() => navigate(action.target), 800);
        }
        break;
      }

      // ANALYZE_SPENDING is handled on backend — just save the response text
      case "ANALYZE_SPENDING": {
        if (botText) {
          setLastAnalysis(botText);
        }
        // Backend also returns NAVIGATE after analysis, handled by next action
        break;
      }

      default:
        break;
    }
  };

  const runClientFallback = async (userText) => {
    const action = buildClientFallbackAction(userText);

    if (!action) {
      addMessage(buildBasicFinanceReply(userText), "bot");
      return;
    }

    if (action.type === "ADD_EXPENSE") {
      const { amount, category, mode, date } = action.payload;
      try {
        await api.expenses.add({ amount, category, mode, date });
        addMessage(`Expense of Rs ${amount} added under ${category.charAt(0).toUpperCase() + category.slice(1)}!`, "bot");
      } catch (err) {
        addMessage("I understood this as an expense, but I could not save it right now. Please try again when the server is reachable.", "bot");
      }
      return;
    }

    if (action.type === "ADD_INCOME") {
      const { amount, source, paymentMethod, date } = action.payload;
      try {
        await api.income.add({ amount, source, paymentMethod, date });
        addMessage(`Income of Rs ${amount} from ${source} logged successfully!`, "bot");
      } catch (err) {
        addMessage("I understood this as income, but I could not save it right now. Please try again when the server is reachable.", "bot");
      }
      return;
    }

    if (action.type === "NAVIGATE") {
      addMessage("Opening that page for you.", "bot");
      setTimeout(() => navigate(action.target), 800);
    }
  };

  const sendMessage = async (userText) => {
    if (!userText.trim()) return;

    addMessage(userText, "user");
    setIsLoading(true);

    try {
      const response = await api.chat.sendMessage({
        sender: "user",
        message: userText
      });

      if (!response || !response.success) {
        addMessage("Something went wrong. Please try again.", "bot");
        return;
      }

      const { message: botText, action } = response.reply;

      if (botText === STALE_CHAT_FALLBACK) {
        await runClientFallback(userText);
        return;
      }

      // Show the AI's text response
      addMessage(botText, "bot");

      // If action is NAVIGATE but the message came from an ANALYZE_SPENDING flow,
      // save the bot text as the last analysis before navigating
      if (action && action.type === "NAVIGATE" && botText && botText.includes("spending the most")) {
        setLastAnalysis(botText);
      }

      // Execute the action
      await handleAction(action, botText);

    } catch (error) {
      await runClientFallback(userText);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage, isLoading, lastAnalysis }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }
  return context;
}
