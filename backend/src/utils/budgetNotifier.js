const sendEmail = require("./sendEmail");

const CATEGORY_SUGGESTIONS = {
  food: "Try meal planning, pack lunches, and cook at home more often to cut food costs.",
  transport: "Use public transit, carpool, or walk for short trips to reduce transport spending.",
  shopping: "Avoid impulse buys, compare prices, and wait 24 hours before making non-essential purchases.",
  entertainment: "Choose low-cost or free entertainment options and set a monthly spending cap.",
  billsUtilities: "Review subscriptions, lower energy use, and pay attention to bills to trim expenses.",
  health: "Look for generic medicines, preventative care, and community health resources where possible.",
  education: "Use free courses, library resources, and study materials before spending on extras.",
  other: "Track miscellaneous spending closely so small purchases don't add up unexpectedly.",
};

const MOTIVATIONAL_QUOTES = [
  "Every rupee you save today brings you closer to your financial goals tomorrow.",
  "Small smart choices now make big financial wins later.",
  "The best investment is the one you make in your own financial future.",
  "One extra mindful purchase today means more freedom tomorrow.",
  "Budgeting is not about restriction, it's about giving your money a job.",
  "Every step toward your budget is a step toward financial confidence.",
];

function getSuggestion(category) {
  return CATEGORY_SUGGESTIONS[category] || CATEGORY_SUGGESTIONS.other;
}

function getMotivationalQuote() {
  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[index];
}

async function sendBudgetOverrunNotification(user, categoryLabel, budgetAmount, spentAmount) {
  const suggestion = getSuggestion(categoryLabel);
  const quote = getMotivationalQuote();

  const subject = `Budget alert: ${categoryLabel} overspend detected`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.5;">
      <h2 style="color: #1f2937;">Hey ${user.name},</h2>
      <p>We noticed you've exceeded your budget for <strong>${categoryLabel}</strong>.</p>
      <table style="width: 100%; max-width: 520px; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">Budget</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">₹${budgetAmount}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">Spent</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">₹${spentAmount}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">Overspent by</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">₹${Math.max(0, spentAmount - budgetAmount)}</td>
        </tr>
      </table>
      <p><strong>Suggestion:</strong> ${suggestion}</p>
      <p style="margin-top: 24px; font-style: italic; color: #475569;">"${quote}"</p>
      <p>Keep going — small adjustments can make a big difference.</p>
    </div>
  `;

  const text = `Hey ${user.name},\n\n` +
    `You have exceeded your budget for ${categoryLabel}.\n` +
    `Budget: ₹${budgetAmount}\n` +
    `Spent: ₹${spentAmount}\n` +
    `Overspent by: ₹${Math.max(0, spentAmount - budgetAmount)}\n\n` +
    `Suggestion: ${suggestion}\n\n` +
    `"${quote}"\n\n` +
    `Keep going — small adjustments can make a big difference.`;

  return sendEmail({
    to: user.email,
    subject,
    html,
    text,
  });
}

module.exports = {
  sendBudgetOverrunNotification,
};
