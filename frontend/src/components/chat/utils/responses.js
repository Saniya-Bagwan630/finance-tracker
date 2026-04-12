export function getMockResponse(intent) {
  switch (intent) {
    case "ADD_EXPENSE":
      return "Sure! Please tell me how much you spent and on what.";

    case "CREATE_GOAL":
      return "Great! What are you saving for and how much do you need?";

    case "ANALYZE_SPENDING":
      return "Here’s a summary of your recent spending trends.";

    default:
      return "Sorry, I didn’t understand that. Try asking about expenses or goals.";
  }
}
