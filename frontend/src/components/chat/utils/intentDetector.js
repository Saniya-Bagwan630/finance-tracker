import { CHATBOT_ACTIONS } from "../../../constants/chatbotActions";

/**
 * Detects user intent from raw text.
 * Returns a structured intent object.
 * Does NOT create payloads.
 * Does NOT perform actions.
 */
export function detectIntent(message) {
  const text = message.toLowerCase().trim();

  // ✅ ADD_EXPENSE - Most specific first
  if (
    (text.includes("spent") || text.includes("paid") || text.includes("bought")) &&
    text.match(/\d+/)
  ) {
    return { intent: CHATBOT_ACTIONS.ADD_EXPENSE };
  }

  if (text.includes("add expense")) {
    return { intent: CHATBOT_ACTIONS.ADD_EXPENSE };
  }

  // ✅ ADD_SAVING
  if (
    (text.includes("i saved") || text.includes("put aside") || text.includes("deposited")) &&
    text.match(/\d+/)
  ) {
    return { intent: CHATBOT_ACTIONS.ADD_SAVING };
  }

  // ✅ CREATE_GOAL
  if (
    text.includes("create goal") ||
    text.includes("save for") ||
    text.includes("new goal")
  ) {
    return { intent: CHATBOT_ACTIONS.CREATE_GOAL };
  }

  // ✅ READ-ONLY: Recent expenses
  if (
    text.includes("recent expenses") ||
    text.includes("where is my money") ||
    text.includes("show my expenses") ||
    text.includes("last 30 days")
  ) {
    return { intent: CHATBOT_ACTIONS.GET_RECENT_EXPENSES };
  }

  // ✅ READ-ONLY: Goals overview
  if (
    text.includes("my goals") ||
    text.includes("show goals") ||
    text.includes("what am i saving") ||
    text.includes("current goals")
  ) {
    return { intent: CHATBOT_ACTIONS.GET_GOALS_OVERVIEW };
  }

  // ✅ READ-ONLY: Savings overview
  if (
    text.includes("how much have i saved") ||
    text.includes("total savings") ||
    text.includes("my savings")
  ) {
    return { intent: CHATBOT_ACTIONS.GET_SAVINGS_OVERVIEW };
  }

  // ✅ ANALYZE_SPENDING - after specific checks
  if (
    text.includes("analyze") ||
    text.includes("analysis") ||
    text.includes("spending pattern")
  ) {
    return { intent: CHATBOT_ACTIONS.ANALYZE_SPENDING };
  }

  // ✅ DASHBOARD_SUMMARY
  if (
    text.includes("summary") ||
    text.includes("overview") ||
    text.includes("how am i doing")
  ) {
    return { intent: CHATBOT_ACTIONS.GET_DASHBOARD_SUMMARY };
  }

  // ✅ EXPLAIN_CONCEPT
  if (
    text.includes("what is") ||
    text.includes("explain") ||
    text.includes("how does") ||
    text.includes("tell me about")
  ) {
    return { intent: CHATBOT_ACTIONS.EXPLAIN_CONCEPT };
  }

  return { intent: CHATBOT_ACTIONS.UNKNOWN };
}