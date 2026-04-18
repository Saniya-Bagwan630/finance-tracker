const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function clampDate(date, minDate, maxDate) {
  const time = new Date(date).getTime();
  const minTime = new Date(minDate).getTime();
  const maxTime = new Date(maxDate).getTime();
  return new Date(Math.min(Math.max(time, minTime), maxTime));
}

function getDaysBetweenInclusive(startDate, endDate) {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1);
}

function getMonthsBetweenInclusive(startDate, endDate) {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1;
  return Math.max(1, months);
}

function getTotalPeriods(goal) {
  const startDate = startOfDay(goal.created_at || new Date());
  const deadline = startOfDay(goal.deadline);
  const totalDays = getDaysBetweenInclusive(startDate, deadline);

  switch (goal.saving_frequency) {
    case "daily":
      return totalDays;
    case "weekly":
      return Math.max(1, Math.ceil(totalDays / 7));
    case "monthly":
      return getMonthsBetweenInclusive(startDate, deadline);
    default:
      return 1;
  }
}

function getPeriodsPassed(goal, referenceDate = new Date()) {
  const startDate = startOfDay(goal.created_at || new Date());
  const deadline = startOfDay(goal.deadline);
  const cappedDate = clampDate(startOfDay(referenceDate), startDate, deadline);
  const totalDays = getDaysBetweenInclusive(startDate, cappedDate);

  switch (goal.saving_frequency) {
    case "daily":
      return totalDays;
    case "weekly":
      return Math.max(1, Math.ceil(totalDays / 7));
    case "monthly":
      return getMonthsBetweenInclusive(startDate, cappedDate);
    default:
      return 1;
  }
}

function getExpectedContributionPerFrequency(goal) {
  const totalPeriods = getTotalPeriods(goal);
  return totalPeriods > 0 ? goal.target_amount / totalPeriods : goal.target_amount;
}

function getGoalProgressMetrics(goal, savedAmount = goal.saved_amount || 0, referenceDate = new Date()) {
  const targetAmount = Number(goal.target_amount) || 0;
  const safeSavedAmount = Number(savedAmount) || 0;
  const expectedContributionPerFrequency = getExpectedContributionPerFrequency(goal);
  const periodsPassed = getPeriodsPassed(goal, referenceDate);
  const expectedTillNow = expectedContributionPerFrequency * periodsPassed;
  const overallProgress = targetAmount > 0 ? safeSavedAmount / targetAmount : 0;
  const frequencyProgress = expectedTillNow > 0 ? safeSavedAmount / expectedTillNow : 0;

  return {
    overallProgress,
    frequencyProgress,
    expectedContributionPerFrequency,
    expectedTillNow,
    periodsPassed,
  };
}

function isSameDay(first, second) {
  if (!first || !second) return false;
  return startOfDay(first).getTime() === startOfDay(second).getTime();
}

function getPeriodIndex(goal, date = new Date()) {
  const startDate = startOfDay(goal.created_at || new Date());
  const currentDate = startOfDay(date);

  if (goal.saving_frequency === "daily") {
    return Math.floor((currentDate.getTime() - startDate.getTime()) / MS_PER_DAY);
  }

  if (goal.saving_frequency === "weekly") {
    return Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * MS_PER_DAY));
  }

  return (
    (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
    (currentDate.getMonth() - startDate.getMonth())
  );
}

function getPeriodBounds(goal, date = new Date()) {
  const startDate = startOfDay(goal.created_at || new Date());
  const deadline = startOfDay(goal.deadline);
  const periodIndex = Math.max(0, getPeriodIndex(goal, date));
  let periodStart;
  let periodEnd;

  if (goal.saving_frequency === "daily") {
    periodStart = new Date(startDate);
    periodStart.setDate(periodStart.getDate() + periodIndex);
    periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 1);
  } else if (goal.saving_frequency === "weekly") {
    periodStart = new Date(startDate);
    periodStart.setDate(periodStart.getDate() + periodIndex * 7);
    periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 7);
  } else {
    periodStart = new Date(startDate);
    periodStart.setMonth(periodStart.getMonth() + periodIndex);
    periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  if (periodStart > deadline) {
    periodStart = new Date(deadline);
  }

  if (periodEnd > deadline) {
    periodEnd = new Date(deadline);
    periodEnd.setDate(periodEnd.getDate() + 1);
  }

  return { periodStart, periodEnd, periodIndex };
}

module.exports = {
  MS_PER_DAY,
  startOfDay,
  getTotalPeriods,
  getPeriodsPassed,
  getExpectedContributionPerFrequency,
  getGoalProgressMetrics,
  getPeriodBounds,
  getPeriodIndex,
  isSameDay,
};
