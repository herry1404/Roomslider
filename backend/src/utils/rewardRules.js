const { randomInt } = require("crypto");

function calculateCheckInStreak(previousCheckIn, yesterdayKey) {
  return previousCheckIn && previousCheckIn.dateKey === yesterdayKey
    ? previousCheckIn.streak + 1
    : 1;
}

function chooseWeightedReward(rewards, randomInteger = randomInt) {
  const totalWeight = rewards.reduce((total, reward) => total + reward.weight, 0);
  if (!Number.isSafeInteger(totalWeight) || totalWeight <= 0 || totalWeight > 2147483647) {
    throw new Error("Reward weights must have a positive, safe integer total.");
  }
  let roll = randomInteger(totalWeight);
  for (const reward of rewards) {
    if (roll < reward.weight) return reward;
    roll -= reward.weight;
  }
  return rewards[rewards.length - 1];
}

async function trySpendDailyBudget(CafeModel, cafeId, dateKey, valueRs) {
  return CafeModel.findOneAndUpdate(
    {
      _id: cafeId,
      budgetDate: dateKey,
      $expr: {
        $lte: [{ $add: ["$spentTodayRs", valueRs] }, "$dailyBudgetRs"],
      },
    },
    { $inc: { spentTodayRs: valueRs } },
    { returnDocument: "after" }
  );
}

module.exports = {
  calculateCheckInStreak,
  chooseWeightedReward,
  trySpendDailyBudget,
};
