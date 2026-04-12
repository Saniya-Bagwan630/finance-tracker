import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const ChatContext = createContext(null);

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
          await api.expenses.add({
            amount: Number(amount),
            category,
            mode: mode || "Cash",
            date: date || new Date().toISOString().split("T")[0]
          });
          addMessage(`✅ Expense of ₹${amount} added under ${category.charAt(0).toUpperCase() + category.slice(1)}!`, "bot");
        } catch (err) {
          console.error("ADD_EXPENSE error:", err);
          addMessage("❌ Couldn't add the expense. Please try again.", "bot");
        }
        break;
      }

      case "ADD_INCOME": {
        try {
          const { amount, source, paymentMethod, date } = action.payload;
          await api.income.add({
            amount: Number(amount),
            source,
            paymentMethod: paymentMethod || "Account",
            date: date || new Date().toISOString().split("T")[0]
          });
          addMessage(`✅ Income of ₹${amount} from ${source} logged successfully!`, "bot");
        } catch (err) {
          console.error("ADD_INCOME error:", err);
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
      console.error("💥 SEND MESSAGE ERROR:", error);
      addMessage("Something went wrong. Please try again.", "bot");
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