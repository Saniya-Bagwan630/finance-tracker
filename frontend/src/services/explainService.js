// Explain-Concept service
// SAFE: text-only, no finance logic, no DB access
// OpenAI is ONLY used for explanations, NEVER for financial decisions

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY; // From .env file

// 🔍 DEBUG: Check if API key is loaded
console.log("🔑 OpenAI API Key status:", {
  exists: !!OPENAI_API_KEY,
  length: OPENAI_API_KEY ? OPENAI_API_KEY.length : 0,
  firstChars: OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 7) + "..." : "NOT LOADED"
});

// Fallback explanations (used when OpenAI fails or is not configured)
const fallbackExplanations = {
  // Budget & Planning
  budgeting: "Budgeting is the process of planning how you will spend and save your money over a specific period, usually monthly. It helps you track income and expenses.",
  budget: "A budget is a plan for your money showing income, expenses, and savings. It's like a roadmap for financial decisions!",
  
  // Savings
  savings: "Savings refer to the portion of income that you set aside for future use instead of spending immediately. It's your financial safety net!",
  saving: "Saving means putting aside money regularly for future needs. Even ₹50/week adds up over time!",
  "emergency fund": "An emergency fund is money saved specifically to cover unexpected expenses like medical bills or urgent repairs. Aim for 3-6 months of expenses.",
  
  // Investment
  investment: "Investment means using money to buy assets that may grow in value over time, like stocks or mutual funds. It's different from saving because it involves some risk.",
  investing: "Investing is putting your money to work so it can potentially grow. While savings sit safely, investments can grow faster but have some risk.",
  "stock market": "The stock market is where shares of companies are bought and sold. When you buy a stock, you own a small part of that company. Prices go up and down based on company performance.",
  stocks: "Stocks (or shares) represent ownership in a company. If the company does well, the stock value increases. It's a way to invest for long-term growth.",
  shares: "Shares are units of ownership in a company. Buying shares means you own a small part of that business and can benefit from its growth.",
  "mutual fund": "A mutual fund pools money from many investors to buy a variety of stocks and bonds. It's a way to invest in many companies at once, reducing risk.",
  "mutual funds": "Mutual funds are investment vehicles that collect money from multiple people to invest in diverse assets. Professional managers handle the investments.",
  
  // Expenses
  expenses: "Expenses are the money you spend on things you need or want. Tracking them helps you understand your spending patterns and make better financial decisions.",
  "fixed expenses": "Fixed expenses are costs that stay the same each month, like rent or subscriptions. They're predictable and easy to plan for in your budget.",
  "variable expenses": "Variable expenses change from month to month, like food or entertainment. These are areas where you can usually cut back if needed.",
  "essential expenses": "Essential expenses are things you MUST pay for: rent, food, utilities, transportation. These come first in your budget.",
  "non-essential expenses": "Non-essential expenses are things you want but don't strictly need: entertainment, dining out, hobbies. These are flexible spending categories.",
  
  // Goals
  goals: "Financial goals are specific targets you set for your money, like saving ₹50,000 for a laptop. Having clear goals makes saving easier and keeps you motivated!",
  "short-term goals": "Short-term goals are things you want to achieve in less than a year, like buying a new phone or taking a trip. They keep you motivated!",
  "long-term goals": "Long-term goals take more than a year to achieve, like saving for higher education or starting a business. They require consistent effort.",
  
  // Income
  income: "Income is money you receive from various sources like salary, freelancing, or pocket money. This is what funds your budget and allows you to save!",
  salary: "Salary is the fixed payment you receive regularly (monthly/weekly) from your employer in exchange for your work. It's your primary income source.",
  "passive income": "Passive income is money earned with minimal ongoing effort, like interest from savings, rental income, or dividends from investments.",
  
  // Banking & Money Management
  interest: "Interest is the cost of borrowing money or the reward for saving it. Banks pay you interest on savings, and you pay interest on loans.",
  "compound interest": "Compound interest means earning interest on your interest! Your money grows faster over time. Einstein called it the 8th wonder of the world!",
  inflation: "Inflation means things get more expensive over time. ₹100 today won't buy as much in 10 years, which is why investing matters to beat inflation.",
  loan: "A loan is money borrowed that must be repaid with interest. Common types include student loans, home loans, and personal loans.",
  debt: "Debt is money you owe to others. While some debt (like education loans) can be good, too much debt can hurt your financial health.",
  credit: "Credit is the ability to borrow money or access goods/services with the promise to pay later. Good credit history helps you get loans at better rates.",
  
  // Financial Concepts
  needs: "Needs are things essential for survival: food, shelter, basic clothing, healthcare. These should be your spending priority in any budget.",
  wants: "Wants are things that make life enjoyable but aren't essential: latest gadgets, eating out, luxury items. It's okay to enjoy wants, just budget for them!",
  roi: "ROI (Return on Investment) measures how much profit you make from an investment compared to its cost. Higher ROI means better returns.",
  "financial planning": "Financial planning is organizing your money to achieve life goals. It includes budgeting, saving, investing, and preparing for emergencies.",
  diversification: "Diversification means spreading your investments across different types to reduce risk. Don't put all your eggs in one basket!",
  
  // Modern Finance
  upi: "UPI (Unified Payments Interface) is an instant payment system in India that lets you transfer money between bank accounts using mobile apps like Google Pay or PhonePe.",
  "digital wallet": "A digital wallet is an electronic device or app that stores payment information for making transactions. Examples include Paytam, Google Pay.",
  cryptocurrency: "Cryptocurrency is digital money that exists only online, like Bitcoin. It's highly volatile and risky - not recommended for beginners!",
  
  // Career & Earnings
  freelancing: "Freelancing means working independently for multiple clients rather than being employed by one company. You manage your own time and projects.",
  "side hustle": "A side hustle is extra work you do outside your main job to earn additional income. It could be freelancing, tutoring, or selling products online."
};

/**
 * Explains financial concepts using OpenAI (when available) or fallback
 */
export async function explainConcept(topic) {
  if (!topic || !topic.trim()) {
    return "💡 I can explain financial concepts! Try asking about: budgeting, savings, expenses, goals, investing, stock market, or emergency funds.";
  }

  const searchTerm = topic.toLowerCase().trim();

  console.log("🔍 Explain request for:", searchTerm);
  console.log("🔑 API Key available:", !!OPENAI_API_KEY);

  // Try OpenAI first (if API key is configured)
  if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here') {
    console.log("🤖 Attempting OpenAI call...");
    try {
      const explanation = await getOpenAIExplanation(searchTerm);
      console.log("✅ OpenAI response received!");
      return `💡 ${explanation}`;
    } catch (error) {
      console.error("❌ OpenAI failed:", error.message);
      console.error("Full error:", error);
      // Fall through to fallback explanations
    }
  } else {
    console.log("⚠️ OpenAI API key not configured, using fallback");
  }

  // Fallback: Use predefined explanations
  console.log("📚 Using fallback explanations");
  
  // Direct match
  if (fallbackExplanations[searchTerm]) {
    return `💡 **${capitalizeFirst(searchTerm)}**: ${fallbackExplanations[searchTerm]}`;
  }

  // Partial match
  for (const [key, explanation] of Object.entries(fallbackExplanations)) {
    if (searchTerm.includes(key) || key.includes(searchTerm)) {
      return `💡 **${capitalizeFirst(key)}**: ${explanation}`;
    }
  }

  // No match found
  return `💡 I don't have a detailed explanation for "${topic}" yet. Try asking about: budgeting, savings, expenses, goals, investing, stock market, mutual funds, or emergency funds.`;
}

/**
 * Gets explanation from OpenAI
 */
async function getOpenAIExplanation(topic) {
  console.log("🌐 Making OpenAI API request...");
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a financial education assistant for students in India.

STRICT RULES:
1. Provide ONLY educational explanations of financial concepts
2. NEVER give personalized financial advice
3. NEVER recommend specific investments or products
4. NEVER make calculations or projections
5. Use simple, student-friendly language
6. Keep explanations under 100 words
7. Use Indian context and currency (₹) when relevant

Your job is to EXPLAIN concepts, not advise on money decisions.`
        },
        {
          role: 'user',
          content: `Explain this financial concept in simple terms: ${topic}`
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    })
  });

  console.log("📡 OpenAI response status:", response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("❌ OpenAI error response:", error);
    throw new Error(error.error?.message || `API failed with status ${response.status}`);
  }

  const data = await response.json();
  console.log("📦 OpenAI data received:", data);
  
  const explanation = data.choices[0].message.content.trim();

  // Safety check
  const dangerousWords = ['you should', 'i recommend', 'invest in', 'buy', 'sell'];
  if (dangerousWords.some(word => explanation.toLowerCase().includes(word))) {
    console.warn("⚠️ OpenAI response contained advice, rejecting");
    throw new Error("Response contained advice");
  }

  return explanation;
}

// Helper function
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}