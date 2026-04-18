const sendEmail = require("./sendEmail");
const { getGoalProgressMetrics } = require("./goalProgress");

function formatCurrency(amount) {
  return Number(amount || 0).toFixed(2);
}

function goalName(goal) {
  return goal.goal_name || "Savings Goal";
}

async function sendGoalCreationEmail(user, goal) {
  return sendEmail({
    to: user.email,
    subject: `Goal created: ${goalName(goal)}`,
    text:
      `Hi ${user.name},\n\n` +
      `Your goal has been created.\n` +
      `Goal: ${goalName(goal)}\n` +
      `Target: ${formatCurrency(goal.target_amount)}\n` +
      `Deadline: ${new Date(goal.deadline).toDateString()}\n` +
      `Frequency: ${goal.saving_frequency}\n`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #222;">
        <h2>Goal created successfully</h2>
        <p><strong>Goal:</strong> ${goalName(goal)}</p>
        <p><strong>Target:</strong> ${formatCurrency(goal.target_amount)}</p>
        <p><strong>Deadline:</strong> ${new Date(goal.deadline).toDateString()}</p>
        <p><strong>Frequency:</strong> ${goal.saving_frequency}</p>
      </div>
    `,
  });
}

async function sendGoalMissReminderEmail(user, goal, actualSaved, expectedAmount) {
  const deficit = Math.max(expectedAmount - actualSaved, 0);

  return sendEmail({
    to: user.email,
    subject: `Saving reminder: ${goalName(goal)}`,
    text:
      `Hi ${user.name},\n\n` +
      `You are behind on your ${goal.saving_frequency} savings target for ${goalName(goal)}.\n` +
      `Expected amount: ${formatCurrency(expectedAmount)}\n` +
      `Actual saved: ${formatCurrency(actualSaved)}\n` +
      `Deficit: ${formatCurrency(deficit)}\n`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #222;">
        <h2>Saving reminder</h2>
        <p>You have not met the expected ${goal.saving_frequency} saving target for <strong>${goalName(goal)}</strong>.</p>
        <p><strong>Expected amount:</strong> ${formatCurrency(expectedAmount)}</p>
        <p><strong>Actual saved:</strong> ${formatCurrency(actualSaved)}</p>
        <p><strong>Deficit:</strong> ${formatCurrency(deficit)}</p>
      </div>
    `,
  });
}

async function sendDeadlineApproachingEmail(user, goal, savedAmount) {
  const now = new Date();
  const remainingAmount = Math.max((goal.target_amount || 0) - (savedAmount || 0), 0);
  const diffMs = new Date(goal.deadline).getTime() - now.getTime();
  const daysLeft = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  const requiredSavingPerDay = remainingAmount / daysLeft;

  return sendEmail({
    to: user.email,
    subject: `Deadline approaching: ${goalName(goal)}`,
    text:
      `Hi ${user.name},\n\n` +
      `Your goal deadline is approaching.\n` +
      `Goal: ${goalName(goal)}\n` +
      `Remaining amount: ${formatCurrency(remainingAmount)}\n` +
      `Required saving per day: ${formatCurrency(requiredSavingPerDay)}\n`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #222;">
        <h2>Deadline approaching</h2>
        <p><strong>Goal:</strong> ${goalName(goal)}</p>
        <p><strong>Remaining amount:</strong> ${formatCurrency(remainingAmount)}</p>
        <p><strong>Required saving per day:</strong> ${formatCurrency(requiredSavingPerDay)}</p>
      </div>
    `,
  });
}

async function sendDeadlineResultEmail(user, goal, savedAmount) {
  const completed = savedAmount >= goal.target_amount;
  const progress = getGoalProgressMetrics(goal, savedAmount, goal.deadline);
  const advice = "Consider reducing non-essential expenses, increasing contribution frequency, or lowering the target timeline.";

  return sendEmail({
    to: user.email,
    subject: completed ? `Goal achieved: ${goalName(goal)}` : `Goal deadline reached: ${goalName(goal)}`,
    text: completed
      ? `Hi ${user.name},\n\nYou completed ${goalName(goal)}.\nSaved: ${formatCurrency(savedAmount)}\nTarget: ${formatCurrency(goal.target_amount)}\nOverall progress: ${(progress.overallProgress * 100).toFixed(1)}%\n`
      : `Hi ${user.name},\n\nYour goal deadline has been reached.\nSaved: ${formatCurrency(savedAmount)}\nTarget: ${formatCurrency(goal.target_amount)}\nAdvice: ${advice}\n`,
    html: completed
      ? `
        <div style="font-family: Arial, sans-serif; color: #222;">
          <h2>Goal completed</h2>
          <p><strong>Goal:</strong> ${goalName(goal)}</p>
          <p><strong>Saved:</strong> ${formatCurrency(savedAmount)}</p>
          <p><strong>Target:</strong> ${formatCurrency(goal.target_amount)}</p>
          <p><strong>Overall progress:</strong> ${(progress.overallProgress * 100).toFixed(1)}%</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; color: #222;">
          <h2>Goal deadline reached</h2>
          <p><strong>Goal:</strong> ${goalName(goal)}</p>
          <p><strong>Saved:</strong> ${formatCurrency(savedAmount)}</p>
          <p><strong>Target:</strong> ${formatCurrency(goal.target_amount)}</p>
          <p><strong>Advice:</strong> ${advice}</p>
        </div>
      `,
  });
}

module.exports = {
  sendGoalCreationEmail,
  sendGoalMissReminderEmail,
  sendDeadlineApproachingEmail,
  sendDeadlineResultEmail,
};
