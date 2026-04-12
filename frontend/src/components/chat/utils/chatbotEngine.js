import { CHATBOT_ACTIONS } from "../../../constants/chatbotActions";
import {
  extractExpensePayload,
  extractGoalPayload
} from "./dataHelpers";

import { detectIntent } from "./intentDetector";

export function generateChatbotAction(intentResult, userText) {
  switch (intentResult.intent) {
    case CHATBOT_ACTIONS.ADD_EXPENSE: {
      const result = extractExpensePayload(userText);

      if (!result.valid) {
        return {
          action: CHATBOT_ACTIONS.INVALID_INPUT,
          payload: { message: result.error }
        };
      }

      return {
        action: CHATBOT_ACTIONS.ADD_EXPENSE,
        payload: result.payload
      };
    }

    case CHATBOT_ACTIONS.CREATE_GOAL: {
      const result = extractGoalPayload(userText);

      if (!result.valid) {
        return {
          action: CHATBOT_ACTIONS.INVALID_INPUT,
          payload: { message: result.error }
        };
      }

      return {
        action: CHATBOT_ACTIONS.CREATE_GOAL,
        payload: result.payload
      };
    }

    case CHATBOT_ACTIONS.ANALYZE_SPENDING:
      return { action: CHATBOT_ACTIONS.ANALYZE_SPENDING };

    case CHATBOT_ACTIONS.EXPLAIN_CONCEPT: {
      // 🔥 FIXED: Better concept extraction
      let concept = userText.toLowerCase();
      
      // Remove common question words and phrases
      const phrasesToRemove = [
        'explain',
        'what is',
        'what are',
        'what\'s',
        'tell me about',
        'how does',
        'how do',
        'can you explain',
        'please explain',
        'explain the',
        'explain about',
        'what is the',
        'what is a',
        'what are the',
        'tell me the',
        'tell me a',
        'the term',
        'term'  // Remove the word "term" itself
      ];
      
      // Remove each phrase
      phrasesToRemove.forEach(phrase => {
        const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
        concept = concept.replace(regex, '');
      });
      
      // Clean up extra spaces and trim
      concept = concept.replace(/\s+/g, ' ').trim();
      
      return {
        action: CHATBOT_ACTIONS.EXPLAIN_CONCEPT,
        payload: {
          concept: concept
        }
      };
    }

    // READ-ONLY ACTIONS (Layer 2)
    case CHATBOT_ACTIONS.GET_RECENT_EXPENSES:
      return {
        action: CHATBOT_ACTIONS.GET_RECENT_EXPENSES,
        payload: { days: 30 },
      };

    case CHATBOT_ACTIONS.GET_GOALS_OVERVIEW:
      return {
        action: CHATBOT_ACTIONS.GET_GOALS_OVERVIEW,
        payload: {},
      };

    case CHATBOT_ACTIONS.GET_DASHBOARD_SUMMARY:
      return {
        action: CHATBOT_ACTIONS.GET_DASHBOARD_SUMMARY,
        payload: {},
      };

    case CHATBOT_ACTIONS.ADD_SAVING: {
      const amountMatch = userText.match(/₹?\s?(\d+)/);

      if (!amountMatch) {
        return {
          action: CHATBOT_ACTIONS.INVALID_INPUT,
          payload: { message: "Please specify how much you saved (e.g., 'I saved 50')." },
        };
      }

      return {
        action: CHATBOT_ACTIONS.ADD_SAVING,
        payload: {
          amount: Number(amountMatch[1]),
          // goal_id will be fetched in ChatContext
        },
      };
    }

    case CHATBOT_ACTIONS.GET_SAVINGS_OVERVIEW:
      return {
        action: CHATBOT_ACTIONS.GET_SAVINGS_OVERVIEW,
        payload: {},
      };

    default:
      return { action: CHATBOT_ACTIONS.UNKNOWN };
  }
}