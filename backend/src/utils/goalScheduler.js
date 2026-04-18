const Goal = require("../models/Goal");
const User = require("../models/User");
const Saving = require("../models/Saving");
const { getExpectedContributionPerFrequency, getPeriodBounds, startOfDay } = require("./goalProgress");
const {
  sendGoalMissReminderEmail,
  sendDeadlineApproachingEmail,
  sendDeadlineResultEmail,
} = require("./goalNotifier");

const DAY_MS = 24 * 60 * 60 * 1000;

async function getSavingsInRange(goal, periodStart, periodEnd) {
  const result = await Saving.aggregate([
    {
      $match: {
        user_id: goal.user_id,
        goal_id: goal._id,
        date: { $gte: periodStart, $lt: periodEnd },
      },
    },
    {
      $group: {
        _id: null,
        totalSaved: { $sum: "$amount" },
      },
    },
  ]);

  return result[0]?.totalSaved || 0;
}

async function runGoalChecks() {
  const today = startOfDay(new Date());
  const goals = await Goal.find({});

  for (const goal of goals) {
    const user = await User.findById(goal.user_id);
    if (!user?.email) continue;

    const expectedPerPeriod = getExpectedContributionPerFrequency(goal);
    const { periodStart, periodEnd } = getPeriodBounds(goal, today);
    const actualSaved = await getSavingsInRange(goal, periodStart, periodEnd);
    const daysUntilDeadline = Math.ceil((startOfDay(goal.deadline).getTime() - today.getTime()) / DAY_MS);

    if (goal.saved_amount < goal.target_amount && actualSaved < expectedPerPeriod) {
      const lastMissReminder = goal.lastMissedReminderSentAt ? startOfDay(goal.lastMissedReminderSentAt) : null;
      if (!lastMissReminder || lastMissReminder.getTime() !== today.getTime()) {
        try {
          await sendGoalMissReminderEmail(user, goal, actualSaved, expectedPerPeriod);
          goal.lastMissedReminderSentAt = new Date();
        } catch (error) {
          console.error(`Goal miss reminder failed for ${goal._id}:`, error);
        }
      }
    }

    if (
      goal.saved_amount < goal.target_amount &&
      daysUntilDeadline >= 0 &&
      daysUntilDeadline <= 3
    ) {
      const lastDeadlineReminder = goal.lastDeadlineReminderSentAt ? startOfDay(goal.lastDeadlineReminderSentAt) : null;
      if (!lastDeadlineReminder || lastDeadlineReminder.getTime() !== today.getTime()) {
        try {
          await sendDeadlineApproachingEmail(user, goal, goal.saved_amount || 0);
          goal.lastDeadlineReminderSentAt = new Date();
        } catch (error) {
          console.error(`Deadline reminder failed for ${goal._id}:`, error);
        }
      }
    }

    if (daysUntilDeadline <= 0 && !goal.deadlineResultSentAt) {
      try {
        await sendDeadlineResultEmail(user, goal, goal.saved_amount || 0);
        goal.deadlineResultSentAt = new Date();
      } catch (error) {
        console.error(`Deadline result email failed for ${goal._id}:`, error);
      }
    }

    await goal.save();
  }
}

function getDelayUntilNextRun() {
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(0, 5, 0, 0);

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun.getTime() - now.getTime();
}

function startGoalScheduler() {
  const scheduleNextRun = () => {
    const delay = getDelayUntilNextRun();
    setTimeout(async () => {
      try {
        await runGoalChecks();
      } catch (error) {
        console.error("Goal scheduler failed:", error);
      } finally {
        scheduleNextRun();
      }
    }, delay);
  };

  scheduleNextRun();
}

module.exports = {
  runGoalChecks,
  startGoalScheduler,
};
