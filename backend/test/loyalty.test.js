const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { once } = require("node:events");
const bcrypt = require("bcryptjs");
const service = require("../src/services/loyalty.service");
const LoyaltyCafe = require("../src/models/LoyaltyCafe");
const { staffPinAuth, staffPinLimiter } = require("../src/middleware/loyaltyStaffAuth");

const makeMemoryModels = (options = {}) => {
  const now = new Date("2026-10-17T14:30:00.000Z");
  const cafe = {
    slug: options.slug || "roomslider-demo",
    name: "RoomSlider",
    isDemo: true,
    active: true,
    stampsRequired: options.stampsRequired || 5,
    dailyStampLimit: options.dailyStampLimit ?? 1,
    rewardExpiryDays: 7,
    stampRewardLabel: "Free Chai",
    dailyRewardBudget: options.dailyRewardBudget ?? 10,
    prizes: options.prizes || [{ key: "none", label: "Better luck kal", weight: 100, type: "none" }],
  };
  const cards = [];
  const events = [];
  const rewards = [];
  const spins = [];
  const stampCounters = [];
  const budgets = [];
  let nextId = 1;
  const id = () => String(nextId++);
  const matches = (row, filter) => Object.entries(filter).every(([key, expected]) => {
    if (expected && typeof expected === "object" && !(expected instanceof Date)) {
      if ("$gt" in expected) return row[key] > expected.$gt;
      if ("$lt" in expected) return row[key] < expected.$lt;
      if ("$gte" in expected) return row[key] >= expected.$gte;
      if ("$lte" in expected) return row[key] <= expected.$lte;
    }
    return row[key] === expected;
  });
  const query = (getter) => ({ lean: async () => getter(), sort: () => ({ lean: async () => getter() }), select: function () { return this; } });
  const Cafe = { findOne: (filter) => query(() => matches(cafe, filter) ? { ...cafe } : null) };
  const Card = {
    exists: async (filter) => cards.some((card) => matches(card, filter)) ? { _id: "exists" } : null,
    create: async (value) => {
      const row = { _id: id(), stamps: 0, totalStamps: 0, completedCards: 0, ...value };
      if (cards.some((card) => card.cafeSlug === row.cafeSlug && card.cardCode === row.cardCode)) {
        const error = new Error("duplicate card code"); error.code = 11000; error.keyPattern = { cardCode: 1 }; throw error;
      }
      if (cards.some((card) => card.cafeSlug === row.cafeSlug && card.phone === row.phone)) {
        const error = new Error("duplicate phone"); error.code = 11000; error.keyPattern = { phone: 1 }; throw error;
      }
      cards.push(row);
      return { ...row };
    },
    findOne: (filter) => query(() => cards.find((row) => matches(row, filter)) || null),
    findOneAndUpdate: async (filter, pipeline) => {
      const card = cards.find((row) => matches(row, filter));
      if (!card) return null;
      if (Array.isArray(pipeline)) {
        card.totalStamps += 1;
        if (card.totalStamps % cafe.stampsRequired === 0) {
          card.stamps = 0;
          card.completedCards += 1;
        } else {
          card.stamps += 1;
        }
      }
      return { ...card };
    },
  };
  const counterModel = (rows) => ({
    updateOne: async (filter, update, options = {}) => {
      let row = rows.find((value) => matches(value, filter));
      if (!row && options.upsert) {
        row = { ...filter, count: 0 };
        rows.push(row);
      } else if (row && update.$inc) {
        row.count += update.$inc.count;
      }
      return { acknowledged: true };
    },
    findOneAndUpdate: async (filter, update) => {
      const row = rows.find((value) => matches(value, Object.fromEntries(Object.entries(filter).filter(([key]) => key !== "count"))));
      if (!row || row.count >= filter.count.$lt) return null;
      row.count += update.$inc.count;
      return { ...row };
    },
    deleteOne: async (filter) => {
      const index = rows.findIndex((value) => matches(value, filter));
      if (index >= 0) rows.splice(index, 1);
    },
  });
  const Events = {
    create: async (value) => { const row = { _id: id(), ...value }; events.push(row); return row; },
    deleteOne: async (filter) => { const index = events.findIndex((row) => matches(row, filter)); if (index >= 0) events.splice(index, 1); },
    deleteMany: async (filter) => { for (let i = events.length - 1; i >= 0; i -= 1) if (matches(events[i], filter)) events.splice(i, 1); },
  };
  const Reward = {
    create: async (value) => {
      if (rewards.some((reward) => reward.code === value.code)) {
        const error = new Error("duplicate reward code"); error.code = 11000; error.keyPattern = { code: 1 }; throw error;
      }
      const row = { _id: id(), ...value };
      rewards.push(row);
      return row;
    },
    updateMany: async (filter, update) => {
      rewards.filter((row) => matches(row, filter)).forEach((row) => Object.assign(row, update.$set));
    },
    updateOne: async (filter, update) => {
      const row = rewards.find((value) => matches(value, filter));
      if (row) Object.assign(row, update.$set);
    },
    find: (filter) => query(() => rewards.filter((row) => matches(row, filter))),
    findOneAndUpdate: (filter, update) => {
      const row = rewards.find((value) => matches(value, filter));
      const before = row ? { ...row } : null;
      if (row) Object.assign(row, update.$set);
      return query(() => before);
    },
  };
  const SpinLog = {
    create: async (value) => {
      if (spins.some((row) => matches(row, value))) {
        const error = new Error("duplicate spin"); error.code = 11000; error.keyPattern = { cafeSlug: 1, cardId: 1, dayIST: 1 }; throw error;
      }
      const row = { _id: id(), ...value };
      spins.push(row);
      return row;
    },
    updateOne: async (filter, update) => {
      const row = spins.find((value) => matches(value, filter));
      if (row) Object.assign(row, update.$set);
    },
    findOne: (filter) => query(() => spins.find((row) => matches(row, filter)) || null),
    deleteOne: async (filter) => { const index = spins.findIndex((row) => matches(row, filter)); if (index >= 0) spins.splice(index, 1); },
  };
  return {
    cafe, cards, events, rewards, spins, stampCounters, budgets, now,
    models: {
      LoyaltyCafe: Cafe,
      StampCard: Card,
      StampEvent: Events,
      Reward,
      SpinLog,
      StampDailyCounter: counterModel(stampCounters),
      SpinDailyBudget: counterModel(budgets),
    },
  };
};

const addCard = async (fixture, { cafeSlug = fixture.cafe.slug, stamps = 0, totalStamps = 0 } = {}) => {
  const result = await fixture.models.StampCard.create({
    cafeSlug, name: "Demo Guest", phone: "9876543210", cardCode: "ABC234", tokenHash: service.tokenHash("a".repeat(43)), stamps, totalStamps,
  });
  return result;
};

test("fifth stamp resets progress and issues a reward", async () => {
  const fixture = makeMemoryModels({ dailyStampLimit: 5 });
  const card = await addCard(fixture, { stamps: 4, totalStamps: 4 });
  const result = await service.stampCard({
    slug: fixture.cafe.slug, cardCode: card.cardCode, now: fixture.now, models: fixture.models,
  });
  assert.equal(result.completed, true);
  assert.equal(result.card.stamps, 0);
  assert.equal(result.card.totalStamps, 5);
  assert.equal(result.card.completedCards, 1);
  assert.equal(result.reward.label, "Free Chai");
  assert.equal(result.reward.expiresAt.getTime(), fixture.now.getTime() + 7 * 86400000);
});

test("card creation validates Indian mobiles and returns a one-time hashed-token credential", async () => {
  const fixture = makeMemoryModels();
  await assert.rejects(service.createCard({
    slug: fixture.cafe.slug, name: "Guest", phone: "12345", models: fixture.models,
  }), { status: 400 });
  const result = await service.createCard({
    slug: fixture.cafe.slug, name: "  Trial Guest  ", phone: "9876543210", models: fixture.models,
  });
  assert.equal(result.card.name, "Trial Guest");
  assert.match(result.card.cardCode, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
  assert.equal(result.card.tokenHash, undefined);
  assert.notEqual(fixture.cards[0].tokenHash, result.cardToken);
  assert.equal(fixture.cards[0].tokenHash, service.tokenHash(result.cardToken));
  await assert.rejects(service.createCard({
    slug: fixture.cafe.slug, name: "Guest", phone: "9876543210", models: fixture.models,
  }), { code: "card_exists" });
});

test("daily stamp limit is atomic and enforced", async () => {
  const fixture = makeMemoryModels({ dailyStampLimit: 3 });
  const card = await addCard(fixture);
  const results = await Promise.allSettled(Array.from({ length: 4 }, () => service.stampCard({
    slug: fixture.cafe.slug, cardCode: card.cardCode, now: fixture.now, models: fixture.models,
  })));
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 3);
  assert.equal(results.filter((result) => result.status === "rejected" && result.reason.code === "daily_stamp_limit").length, 1);
});

test("spin rewards use server prizes, consume budget, and expire in three days", async () => {
  const fixture = makeMemoryModels({
    dailyRewardBudget: 1,
    prizes: [{ key: "chai", label: "Free Chai", weight: 1, type: "item" }],
  });
  await addCard(fixture);
  const result = await service.spin({
    slug: fixture.cafe.slug, cardToken: "a".repeat(43), now: fixture.now, models: fixture.models,
  });
  assert.equal(result.prize.key, "chai");
  assert.equal(result.reward.label, "Free Chai");
  assert.equal(result.reward.expiresAt.getTime(), fixture.now.getTime() + 3 * 86400000);
  assert.equal(fixture.budgets[0].count, 1);
});

test("parallel spins allow only one daily result", async () => {
  const fixture = makeMemoryModels();
  const card = await addCard(fixture);
  const results = await Promise.allSettled(Array.from({ length: 2 }, () => service.spin({
    slug: fixture.cafe.slug, cardToken: "a".repeat(43), now: fixture.now, models: fixture.models,
  })));
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected" && result.reason.code === "already_spun").length, 1);
});

test("spin budget exhaustion returns none", async () => {
  const fixture = makeMemoryModels({
    dailyRewardBudget: 0,
    prizes: [{ key: "off5", label: "Rs 5 off", weight: 1, type: "discount" }],
  });
  await addCard(fixture);
  const result = await service.spin({
    slug: fixture.cafe.slug, cardToken: "a".repeat(43), now: fixture.now, models: fixture.models,
  });
  assert.equal(result.prize.key, "none");
  assert.equal(result.reward, null);
  assert.equal(fixture.rewards.length, 0);
});

test("reward redemption succeeds once and rejects expired codes", async () => {
  const fixture = makeMemoryModels();
  const card = await addCard(fixture);
  const valid = await fixture.models.Reward.create({
    code: "23456789", cafeSlug: fixture.cafe.slug, cardId: card._id, source: "spin",
    label: "Free Chai", status: "active", expiresAt: new Date(fixture.now.getTime() + 1000),
  });
  const expired = await fixture.models.Reward.create({
    code: "3456789A", cafeSlug: fixture.cafe.slug, cardId: card._id, source: "spin",
    label: "Expired", status: "active", expiresAt: new Date(fixture.now.getTime() - 1),
  });
  const redeemed = await service.redeem({ slug: fixture.cafe.slug, code: valid.code, now: fixture.now, models: fixture.models });
  assert.equal(redeemed.reward.status, "used");
  await assert.rejects(service.redeem({ slug: fixture.cafe.slug, code: valid.code, now: fixture.now, models: fixture.models }), { code: "reward_unavailable" });
  await assert.rejects(service.redeem({ slug: fixture.cafe.slug, code: expired.code, now: fixture.now, models: fixture.models }), { code: "reward_unavailable" });
});

test("card token is scoped to one cafe", async () => {
  const fixture = makeMemoryModels();
  await addCard(fixture, { cafeSlug: "different-cafe" });
  await assert.rejects(service.getCard({
    slug: fixture.cafe.slug, cardToken: "a".repeat(43), now: fixture.now, models: fixture.models,
  }), { code: "invalid_card_token" });
});

test("staff PIN returns 429 after five incorrect attempts", async () => {
  const originalFindOne = LoyaltyCafe.findOne;
  const hash = await bcrypt.hash("correct-pin", 4);
  LoyaltyCafe.findOne = () => ({
    select() { return this; },
    lean: async () => ({ slug: "pin-limit-test", active: true, isDemo: true, staffPinHash: hash }),
  });
  const app = express();
  app.use(express.json());
  app.post("/:slug/staff/ping", staffPinLimiter, staffPinAuth, (_req, res) => res.json({ success: true }));
  const server = app.listen(0);
  try {
    await once(server, "listening");
    const url = `http://127.0.0.1:${server.address().port}/pin-limit-test/staff/ping`;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await fetch(url, { method: "POST", headers: { "x-staff-pin": "wrong-pin" } });
      assert.equal(response.status, 401);
      assert.equal((await response.json()).message.includes("wrong-pin"), false);
    }
    const limited = await fetch(url, { method: "POST", headers: { "x-staff-pin": "wrong-pin" } });
    assert.equal(limited.status, 429);
    assert.equal((await limited.json()).code, "pin_rate_limited");
  } finally {
    server.close();
    LoyaltyCafe.findOne = originalFindOne;
  }
});
