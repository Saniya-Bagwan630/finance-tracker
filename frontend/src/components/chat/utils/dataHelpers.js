export function fetchExpenses() {
  return [
    { id: 1, category: "Food", amount: 500 },
    { id: 2, category: "Travel", amount: 1200 },
  ];
}

export function fetchGoals() {
  return [
    { id: 1, name: "New Laptop", target: 60000 },
  ];
}

export function fetchExpenseSummary() {
  return {
    total: 1700,
    highestCategory: "Travel",
  };
}

// ✅ Extract expense payload
export function extractExpensePayload(text) {
  const amountMatch = text.match(/₹?\s?(\d+)/);
  const categoryMatch = text.match(/food|travel|rent|shopping|groceries|entertainment|utilities|healthcare|education|transport/i);

  if (!amountMatch) {
    return {
      valid: false,
      error: "Please specify an amount (e.g., '100' or '₹100')"
    };
  }

  if (!categoryMatch) {
    return {
      valid: false,
      error: "Please specify a category (food, travel, rent, shopping, groceries, etc.)"
    };
  }

  const category = categoryMatch[0].toLowerCase();
  const amount = Number(amountMatch[1]);

  return {
    valid: true,
    payload: {
      amount: amount,
      category: category,
      date: new Date().toISOString(),
      source: "chatbot"
    }
  };
}

// ✅ FIXED: Extract goal payload with better date recognition
export function extractGoalPayload(text) {
  const amountMatch = text.match(/₹?\s?(\d+)/);
  
  // 🔥 EXPANDED: Recognize more date formats
  // Matches: "by March", "by 15-02-26", "by 2026-01-30", "next month", "in 3 months"
  const hasDeadline = 
    /by|until|before|deadline|complete|finish/i.test(text) ||
    /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(text) ||  // dd-mm-yy or dd/mm/yyyy
    /january|february|march|april|may|june|july|august|september|october|november|december/i.test(text) ||
    /next month|in \d+ months?/i.test(text);

  if (!amountMatch) {
    return {
      valid: false,
      error: "Please specify target amount (e.g., '5000' or '₹5000')"
    };
  }

  if (!hasDeadline) {
    return {
      valid: false,
      error: "Please specify a deadline (e.g., 'by March', 'by 15-02-26', or 'next month')"
    };
  }

  const targetAmount = Number(amountMatch[1]);
  let deadline;

  // 🔥 Parse different date formats
  
  // Format 1: dd-mm-yy or dd-mm-yyyy or dd/mm/yyyy
  const datePattern = /(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/;
  const dateMatch = text.match(datePattern);
  
  if (dateMatch) {
    let [, day, month, year] = dateMatch;
    
    // Convert 2-digit year to 4-digit
    if (year.length === 2) {
      year = '20' + year;
    }
    
    // Create date (month is 0-indexed in JS)
    deadline = new Date(year, month - 1, day).toISOString();
  }
  // Format 2: Month name (e.g., "by March")
  else if (/january|february|march|april|may|june|july|august|september|october|november|december/i.test(text)) {
    const monthMatch = text.match(/january|february|march|april|may|june|july|august|september|october|november|december/i);
    const months = {
      january: 0, february: 1, march: 2, april: 3,
      may: 4, june: 5, july: 6, august: 7,
      september: 8, october: 9, november: 10, december: 11
    };
    
    const monthName = monthMatch[0].toLowerCase();
    const monthIndex = months[monthName];
    const year = new Date().getFullYear();
    const targetDate = new Date(year, monthIndex + 1, 0); // Last day of month
    
    // If month has passed, use next year
    if (targetDate < new Date()) {
      targetDate.setFullYear(year + 1);
    }
    
    deadline = targetDate.toISOString();
  }
  // Format 3: "next month"
  else if (/next month/i.test(text)) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    deadline = nextMonth.toISOString();
  }
  // Format 4: "in 3 months"
  else if (/in (\d+) months?/i.test(text)) {
    const monthsMatch = text.match(/in (\d+) months?/i);
    const monthsToAdd = parseInt(monthsMatch[1]);
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + monthsToAdd);
    deadline = futureDate.toISOString();
  }
  // Fallback: 3 months from now
  else {
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 3);
    deadline = defaultDate.toISOString();
  }

  return {
    valid: true,
    payload: {
      target_amount: targetAmount,
      deadline: deadline,
      saving_frequency: "weekly"
    }
  };
}