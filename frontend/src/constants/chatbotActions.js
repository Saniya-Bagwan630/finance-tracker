/**
 * CHATBOT ACTION CONTRACT
 *
 * This file defines ALL actions the chatbot is allowed to emit.
 * No other file is allowed to invent new action names.
 * Frontend reacts to these actions.
 * Backend logic is triggered later.
 */

// Action names (ENUM-like)
export const CHATBOT_ACTIONS = {
  ADD_EXPENSE: "ADD_EXPENSE",
  CREATE_GOAL: "CREATE_GOAL",
  ANALYZE_SPENDING: "ANALYZE_SPENDING",
  EXPLAIN_CONCEPT: "EXPLAIN_CONCEPT",
  UNKNOWN: "UNKNOWN",

  // READ-ONLY (Layer 2)
GET_RECENT_EXPENSES: "GET_RECENT_EXPENSES",
GET_GOALS_OVERVIEW: "GET_GOALS_OVERVIEW",
GET_DASHBOARD_SUMMARY: "GET_DASHBOARD_SUMMARY",

// SAVINGS
ADD_SAVING: "ADD_SAVING",
GET_SAVINGS_OVERVIEW: "GET_SAVINGS_OVERVIEW",


};

/**
 * Expected payload structure for each action.
 * This is documentation + discipline.
 * Chatbot MUST follow these shapes.
 */
export const ACTION_PAYLOAD_SCHEMA = {
  ADD_EXPENSE: {
    amount: "number",
    category: "string",
    description: "string",
  },

  CREATE_GOAL: {
    goalName: "string",
    targetAmount: "number",
    deadline: "string", // ISO date string
  },

  ANALYZE_SPENDING: {
    period: "string", // "week" | "month"
  },

  EXPLAIN_CONCEPT: {
    topic: "string",
  },

  ADD_SAVING: {
  amount: "number",
  date: "string",
},

GET_SAVINGS_OVERVIEW: {},


  UNKNOWN: {},

  GET_RECENT_EXPENSES: {
  days: "number", // e.g. 30
},

GET_GOALS_OVERVIEW: {},

GET_DASHBOARD_SUMMARY: {},

};
