const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateCheckInStreak,
  chooseWeightedReward,
  trySpendDailyBudget,
} = require("../src/utils/rewardRules");

test("a check-in on the next day increments the streak; a gap restarts at one", () => {
  assert.equal(calculateCheckInStreak({ dateKey: "2026-10-17", streak: 4 }, "2026-10-17"), 5);
  assert.equal(calculateCheckInStreak({ dateKey: "2026-10-16", streak: 4 }, "2026-10-17"), 1);
  assert.equal(calculateCheckInStreak(null, "2026-10-17"), 1);
});

test("weighted reward selection uses the server-side weight interval", () => {
  const rewards = [
    { label: "small", weight: 3 },
    { label: "large", weight: 2 },
  ];
  assert.equal(chooseWeightedReward(rewards, () => 0).label, "small");
  assert.equal(chooseWeightedReward(rewards, () => 3).label, "large");
});

test("atomic budget deductions never spend more than the daily budget", async () => {
  const state = { budgetDate: "2026-10-18", dailyBudgetRs: 100, spentTodayRs: 0 };
  const CafeModel = {
    async findOneAndUpdate(filter, update) {
      const [sum, limit] = filter.$expr.$lte;
      assert.deepEqual(sum, { $add: ["$spentTodayRs", 10] });
      assert.equal(limit, "$dailyBudgetRs");
      if (filter.budgetDate !== state.budgetDate || state.spentTodayRs + 10 > state.dailyBudgetRs) {
        return null;
      }
      state.spentTodayRs += update.$inc.spentTodayRs;
      return { ...state };
    },
  };

  const results = await Promise.all(
    Array.from({ length: 20 }, () => trySpendDailyBudget(CafeModel, "demo", "2026-10-18", 10))
  );
  assert.equal(results.filter(Boolean).length, 10);
  assert.equal(state.spentTodayRs, 100);
});
