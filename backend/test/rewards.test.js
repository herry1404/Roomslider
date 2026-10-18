const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateCheckInStreak,
  chooseWeightedReward,
  trySpendDailyBudget,
} = require("../src/utils/rewardRules");
const { isAdViewComplete } = require("../src/utils/adRules");
const { tryClaimCouponStock } = require("../src/utils/couponRules");
const Spin = require("../src/models/Spin");

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

test("ad completion requires 90% of the server-side sponsor duration", () => {
  const startedAt = new Date("2026-10-18T10:00:00.000Z");
  assert.equal(isAdViewComplete(startedAt, new Date("2026-10-18T10:00:08.999Z"), 10), false);
  assert.equal(isAdViewComplete(startedAt, new Date("2026-10-18T10:00:09.000Z"), 10), true);
  assert.equal(isAdViewComplete(startedAt, new Date("2026-10-18T10:00:10.800Z"), 12), true);
  assert.equal(isAdViewComplete(startedAt, new Date("2026-10-18T10:00:10.799Z"), 12), false);
});

test("Spin has one unique record per user, cafe, type, and Asia/Kolkata date", () => {
  const indexes = Spin.schema.indexes();
  assert.ok(indexes.some(([fields, options]) => (
    JSON.stringify(fields) === JSON.stringify({ userId: 1, cafeId: 1, type: 1, dateKey: 1 })
      && options.unique === true
  )));
});

test("coupon stock claim uses an atomic in-stock conditional update", async () => {
  const state = { active: true, stock: 1, claimed: 0, expiresAt: null };
  const CouponModel = {
    async findOneAndUpdate(filter, update) {
      assert.equal(filter.active, true);
      assert.deepEqual(filter.stock, { $gt: 0 });
      if (!state.active || state.stock <= 0) return null;
      state.stock += update.$inc.stock;
      state.claimed += update.$inc.claimed;
      return { ...state };
    },
  };
  const [first, second] = await Promise.all([
    tryClaimCouponStock(CouponModel, "coupon", new Date()),
    tryClaimCouponStock(CouponModel, "coupon", new Date()),
  ]);
  assert.equal(Boolean(first) + Boolean(second), 1);
  assert.deepEqual(state, { active: true, stock: 0, claimed: 1, expiresAt: null });
});
