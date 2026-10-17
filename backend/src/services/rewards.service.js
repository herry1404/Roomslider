const { randomInt } = require("crypto");
const Cafe = require("../models/Cafe");
const DailyCode = require("../models/DailyCode");
const CheckIn = require("../models/CheckIn");
const Spin = require("../models/Spin");
const User = require("../models/user.model");
const Owner = require("../models/Owner");
const { getIndiaDateKey, addDaysToDateKey } = require("../utils/rewardDate");
const {
  calculateCheckInStreak,
  chooseWeightedReward,
  trySpendDailyBudget,
} = require("../utils/rewardRules");

const DEMO_SLUG = "roomslider-demo";
const NO_WIN_KEY = "better-luck";
const NO_WIN_REWARD = {
  key: NO_WIN_KEY,
  label: "Better luck next time",
  valueRs: 0,
  weight: 1,
  minStreak: 0,
  isNoWin: true,
};
const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_DIGITS = "23456789";

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function assertCompleteProfile(user) {
  const phone = String(user.phone || "").replace(/\D/g, "").slice(-10);
  const hasBasics = Boolean(
    String(user.name || "").trim()
    && /^[6-9]\d{9}$/.test(phone)
    && String(user.occupation || "").trim()
    && String(user.city || "").trim()
    && String(user.area || "").trim()
  );
  const studentDetailsComplete = user.occupation !== "student"
    || [user.organization, user.course, user.subject, user.studyYear]
      .every((value) => String(value || "").trim());
  if (!hasBasics || !studentDetailsComplete) {
    fail(409, "Complete your profile before checking in or spinning.");
  }
}

function makeCode() {
  const pick = (characters) => characters[randomInt(characters.length)];
  return `${pick(CODE_LETTERS)}${pick(CODE_LETTERS)}${pick(CODE_LETTERS)}${pick(CODE_DIGITS)}${pick(CODE_DIGITS)}`;
}

function makeRedeemCode() {
  const pick = (characters) => characters[randomInt(characters.length)];
  return `WIN-${pick(CODE_LETTERS)}${pick(CODE_DIGITS)}${pick(CODE_LETTERS)}`;
}

function getDemoCafe(slug = DEMO_SLUG) {
  if (slug !== DEMO_SLUG) fail(404, "Rewards are not available for this cafe.");
  return Cafe.findOne({ slug: DEMO_SLUG });
}

async function requireCafe(slug = DEMO_SLUG) {
  const cafe = await getDemoCafe(slug);
  if (!cafe || !cafe.isDemo) fail(404, "Rewards are not available for this cafe.");
  return cafe;
}

async function ensureBudgetDate(cafe, dateKey) {
  await Cafe.updateOne(
    { _id: cafe._id, budgetDate: { $ne: dateKey } },
    { $set: { budgetDate: dateKey, spentTodayRs: 0 } }
  );
  return Cafe.findById(cafe._id);
}

async function ensureDailyCode(cafe, dateKey = getIndiaDateKey()) {
  let dailyCode = await DailyCode.findOne({ cafeId: cafe._id, dateKey });
  if (dailyCode) return dailyCode;
  try {
    return await DailyCode.create({ cafeId: cafe._id, dateKey, code: makeCode() });
  } catch (error) {
    if (error.code !== 11000) throw error;
    dailyCode = await DailyCode.findOne({ cafeId: cafe._id, dateKey });
    if (dailyCode) return dailyCode;
    throw error;
  }
}

function publicRewards(cafe) {
  return [
    ...cafe.rewards.map((reward) => ({
      key: String(reward._id),
      label: reward.label,
      valueRs: reward.valueRs,
      weight: reward.weight,
      minStreak: reward.minStreak || 0,
      isNoWin: false,
    })),
    NO_WIN_REWARD,
  ];
}

async function latestCheckIn(cafeId, userId) {
  return CheckIn.findOne({ cafeId, userId }).sort({ dateKey: -1 });
}

async function getPublicInfo(slug, user) {
  const cafe = await requireCafe(slug);
  const today = getIndiaDateKey();
  await ensureDailyCode(cafe, today);
  const data = {
    cafe: { slug: cafe.slug, name: cafe.name },
    rewards: publicRewards(cafe),
    date: today,
  };
  if (!user || !["user", "admin"].includes(user.role)) return data;

  const [todayCheckIn, todaySpin, latest] = await Promise.all([
    CheckIn.findOne({ cafeId: cafe._id, userId: user._id, dateKey: today }),
    Spin.findOne({ cafeId: cafe._id, userId: user._id, dateKey: today }),
    latestCheckIn(cafe._id, user._id),
  ]);
  const yesterday = addDaysToDateKey(today, -1);
  const streak = todayCheckIn
    ? todayCheckIn.streak
    : latest && latest.dateKey === yesterday
      ? latest.streak
      : 0;
  return {
    ...data,
    user: {
      streak,
      checkedInToday: Boolean(todayCheckIn),
      spunToday: Boolean(todaySpin),
      todaySpin: todaySpin ? {
        reward: todaySpin.rewardSnapshot,
        redeemCode: todaySpin.redeemCode,
        status: todaySpin.status,
        expiresAt: todaySpin.expiresAt,
      } : null,
    },
  };
}

async function checkIn({ slug, user, code }) {
  if (!["user", "admin"].includes(user.role)) fail(403, "A customer account is required to check in.");
  assertCompleteProfile(user);
  const cafe = await requireCafe(slug);
  const today = getIndiaDateKey();
  await ensureDailyCode(cafe, today);
  const dailyCode = await DailyCode.findOne({ cafeId: cafe._id, dateKey: today });
  const alreadyCheckedIn = await CheckIn.exists({ cafeId: cafe._id, userId: user._id, dateKey: today });
  if (alreadyCheckedIn) fail(409, "You have already checked in today.");

  const attemptsPath = `attempts.${user._id}`;
  const attempts = Number(dailyCode.attempts.get(String(user._id)) || 0);
  if (attempts >= 5) fail(429, "Too many incorrect codes. Try again tomorrow.");

  if (typeof code !== "string" || code.trim().toUpperCase() !== dailyCode.code) {
    const updated = await DailyCode.findOneAndUpdate(
      {
        _id: dailyCode._id,
        $or: [
          { [attemptsPath]: { $exists: false } },
          { [attemptsPath]: { $lt: 5 } },
        ],
      },
      { $inc: { [attemptsPath]: 1 } },
      { returnDocument: "after" }
    );
    if (!updated) fail(429, "Too many incorrect codes. Try again tomorrow.");
    const count = Number(updated.attempts.get(String(user._id)) || 0);
    fail(count >= 5 ? 429 : 400, count >= 5
      ? "Too many incorrect codes. Try again tomorrow."
      : `Incorrect code. ${5 - count} attempt(s) remaining.`);
  }

  const yesterday = addDaysToDateKey(today, -1);
  const previousCheckIn = await CheckIn.findOne({
    cafeId: cafe._id,
    userId: user._id,
    dateKey: yesterday,
  });
  const streak = calculateCheckInStreak(previousCheckIn, yesterday);
  try {
    await CheckIn.create({ cafeId: cafe._id, userId: user._id, dateKey: today, streak });
  } catch (error) {
    if (error.code === 11000) fail(409, "You have already checked in today.");
    throw error;
  }
  return { checkedInToday: true, streak, date: today };
}

async function currentCafeAndBudget(slug, dateKey) {
  const cafe = await requireCafe(slug);
  const current = await ensureBudgetDate(cafe, dateKey);
  return {
    cafe: current,
    remainingRs: Math.max(0, current.dailyBudgetRs - current.spentTodayRs),
  };
}

async function spin({ slug, user }) {
  if (!["user", "admin"].includes(user.role)) fail(403, "A customer account is required to spin.");
  assertCompleteProfile(user);
  const cafe = await requireCafe(slug);
  const today = getIndiaDateKey();
  const checkIn = await CheckIn.findOne({ cafeId: cafe._id, userId: user._id, dateKey: today });
  if (!checkIn) fail(403, "Check in with today's cafe code before spinning.");

  let reservation;
  try {
    reservation = await Spin.create({
      cafeId: cafe._id,
      userId: user._id,
      dateKey: today,
      rewardSnapshot: { label: "Spin in progress", valueRs: 0, isNoWin: true },
    });
  } catch (error) {
    if (error.code === 11000) fail(409, "You have already used today's spin.");
    throw error;
  }

  const baseRewards = cafe.rewards.map((reward) => ({
    key: String(reward._id),
    label: reward.label,
    valueRs: reward.valueRs,
    weight: reward.weight,
    minStreak: reward.minStreak || 0,
    isNoWin: false,
  }));
  const eligible = [
    ...baseRewards.filter((reward) => reward.minStreak <= checkIn.streak),
    NO_WIN_REWARD,
  ];
  let selected;
  let budgetSpent = false;

  try {
    for (let attempt = 0; attempt <= eligible.length; attempt += 1) {
      const { cafe: currentCafe, remainingRs } = await currentCafeAndBudget(slug, today);
      const affordable = eligible.filter((reward) => reward.valueRs <= remainingRs);
      selected = chooseWeightedReward(affordable);
      if (selected.valueRs === 0) break;
      const updatedCafe = await trySpendDailyBudget(Cafe, currentCafe._id, today, selected.valueRs);
      if (updatedCafe) {
        budgetSpent = true;
        break;
      }
      selected = null;
    }

    if (!selected) selected = NO_WIN_REWARD;
    const won = !selected.isNoWin;
    const redeemCode = won ? makeRedeemCode() : null;
    const expiresAt = won ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) : null;
    const updated = await Spin.findByIdAndUpdate(
      reservation._id,
      {
        $set: {
          rewardSnapshot: {
            label: selected.label,
            valueRs: selected.valueRs,
            isNoWin: selected.isNoWin,
          },
          redeemCode,
          status: won ? "unused" : null,
          expiresAt,
        },
      },
      { returnDocument: "after", runValidators: true }
    );
    return {
      reward: updated.rewardSnapshot,
      redeemCode: updated.redeemCode,
      status: updated.status,
      expiresAt: updated.expiresAt,
      segmentKey: selected.key,
      segments: eligible.map(({ key, label, weight, valueRs, isNoWin }) => ({
        key, label, weight, valueRs, isNoWin,
      })),
    };
  } catch (error) {
    if (budgetSpent && selected && selected.valueRs > 0) {
      await Cafe.findOneAndUpdate(
        { _id: cafe._id, budgetDate: today, spentTodayRs: { $gte: selected.valueRs } },
        { $inc: { spentTodayRs: -selected.valueRs } },
        { returnDocument: "after" }
      );
    }
    await Spin.findByIdAndUpdate(reservation._id, {
      $set: {
        rewardSnapshot: { label: NO_WIN_REWARD.label, valueRs: 0, isNoWin: true },
        redeemCode: null,
        status: null,
        expiresAt: null,
      },
    });
    throw error;
  }
}

async function myRewards(user) {
  if (!["user", "admin"].includes(user.role)) fail(403, "A customer account is required.");
  const now = new Date();
  await Spin.updateMany(
    { userId: user._id, status: "unused", expiresAt: { $lte: now } },
    { $set: { status: "expired" } }
  );
  const spins = await Spin.find({ userId: user._id, redeemCode: { $ne: null } })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("cafeId", "name slug");
  return {
    rewards: spins.map((spinRecord) => ({
      cafe: spinRecord.cafeId ? { name: spinRecord.cafeId.name, slug: spinRecord.cafeId.slug } : null,
      reward: spinRecord.rewardSnapshot,
      redeemCode: spinRecord.redeemCode,
      status: spinRecord.status,
      expiresAt: spinRecord.expiresAt,
      createdAt: spinRecord.createdAt,
    })),
  };
}

async function authorizeStaff(cafe, user) {
  if (user.role === "admin") return;
  if (user.role !== "owner" || !cafe.ownerId || String(cafe.ownerId) !== String(user._id)) {
    fail(403, "Cafe staff access is required.");
  }
  await Owner.exists({ _id: user._id });
}

async function dashboard({ slug, user }) {
  const cafe = await requireCafe(slug);
  await authorizeStaff(cafe, user);
  const today = getIndiaDateKey();
  const [dailyCode, currentCafe, todayCheckins, recentCheckins] = await Promise.all([
    ensureDailyCode(cafe, today),
    ensureBudgetDate(cafe, today),
    CheckIn.countDocuments({ cafeId: cafe._id, dateKey: today }),
    CheckIn.find({ cafeId: cafe._id })
      .sort({ dateKey: -1 })
      .limit(500)
      .populate("userId", "name"),
  ]);
  const regularsByUser = new Map();
  for (const checkin of recentCheckins) {
    if (!checkin.userId) continue;
    const userId = String(checkin.userId._id);
    if (!regularsByUser.has(userId)) {
      regularsByUser.set(userId, {
        name: checkin.userId.name,
        streak: checkin.streak,
        lastVisit: checkin.dateKey,
      });
    }
  }
  return {
    cafe: { slug: cafe.slug, name: cafe.name },
    date: today,
    code: dailyCode.code,
    dailyBudgetRs: currentCafe.dailyBudgetRs,
    spentTodayRs: currentCafe.spentTodayRs,
    remainingRs: Math.max(0, currentCafe.dailyBudgetRs - currentCafe.spentTodayRs),
    todayCheckins,
    regulars: Array.from(regularsByUser.values()).slice(0, 100),
    rewards: publicRewards(cafe).filter((reward) => !reward.isNoWin),
  };
}

async function regenerateCode({ slug, user }) {
  const cafe = await requireCafe(slug);
  await authorizeStaff(cafe, user);
  const today = getIndiaDateKey();
  const dailyCode = await ensureDailyCode(cafe, today);
  const updated = await DailyCode.findByIdAndUpdate(
    dailyCode._id,
    { $set: { code: makeCode(), regeneratedAt: new Date() } },
    { returnDocument: "after", runValidators: true }
  );
  return { code: updated.code, date: updated.dateKey };
}

async function setBudget({ slug, user, dailyBudgetRs }) {
  const budget = Number(dailyBudgetRs);
  if (!Number.isSafeInteger(budget) || budget < 0 || budget > 1000000) {
    fail(400, "Daily budget must be a whole number between ₹0 and ₹10,00,000.");
  }
  const cafe = await requireCafe(slug);
  await authorizeStaff(cafe, user);
  const today = getIndiaDateKey();
  const current = await ensureBudgetDate(cafe, today);
  const updated = await Cafe.findOneAndUpdate(
    {
      _id: cafe._id,
      budgetDate: today,
      $expr: { $gte: [budget, "$spentTodayRs"] },
    },
    { $set: { dailyBudgetRs: budget } },
    { returnDocument: "after", runValidators: true }
  );
  if (!updated) fail(400, `Budget cannot be lower than today's ₹${current.spentTodayRs} already spent.`);
  return {
    dailyBudgetRs: updated.dailyBudgetRs,
    spentTodayRs: updated.spentTodayRs,
    remainingRs: updated.dailyBudgetRs - updated.spentTodayRs,
  };
}

function validateRewards(rewards) {
  if (!Array.isArray(rewards) || rewards.length < 5 || rewards.length > 7) {
    fail(400, "Configure between 5 and 7 rewards.");
  }
  return rewards.map((reward) => {
    const label = typeof reward.label === "string" ? reward.label.trim() : "";
    const valueRs = Number(reward.valueRs);
    const weight = Number(reward.weight);
    const minStreak = reward.minStreak === "" || reward.minStreak == null ? 0 : Number(reward.minStreak);
    if (!label || label.length > 100
      || !Number.isSafeInteger(valueRs) || valueRs < 0 || valueRs > 100000
      || !Number.isSafeInteger(weight) || weight < 1 || weight > 1000000
      || !Number.isSafeInteger(minStreak) || minStreak < 0 || minStreak > 100000) {
      fail(400, "Each reward needs a label, whole-rupee value, positive weight, and valid minimum streak.");
    }
    return { label, valueRs, weight, minStreak };
  });
}

async function updateRewards({ slug, user, rewards }) {
  const cleanRewards = validateRewards(rewards);
  const cafe = await requireCafe(slug);
  await authorizeStaff(cafe, user);
  await Cafe.updateOne({ _id: cafe._id }, { $set: { rewards: cleanRewards } }, { runValidators: true });
  return { rewards: cleanRewards };
}

async function redeem({ slug, user, code }) {
  const cafe = await requireCafe(slug);
  await authorizeStaff(cafe, user);
  if (typeof code !== "string" || !/^WIN-[A-HJ-NP-Z2-9]{3}$/.test(code.trim().toUpperCase())) {
    fail(400, "Enter a valid reward code.");
  }
  const normalizedCode = code.trim().toUpperCase();
  const spin = await Spin.findOne({ cafeId: cafe._id, redeemCode: normalizedCode }).populate("userId", "name");
  if (!spin) fail(404, "Reward code not found.");
  if (spin.status === "used") fail(409, "This reward has already been redeemed.");
  if (spin.status === "expired" || !spin.expiresAt || spin.expiresAt <= new Date()) {
    if (spin.status === "unused") await Spin.updateOne({ _id: spin._id, status: "unused" }, { $set: { status: "expired" } });
    fail(410, "This reward code has expired.");
  }
  const updated = await Spin.findOneAndUpdate(
    { _id: spin._id, status: "unused", expiresAt: { $gt: new Date() } },
    { $set: { status: "used", redeemedAt: new Date() } },
    { returnDocument: "after" }
  ).populate("userId", "name");
  if (!updated) fail(409, "This reward has already been redeemed or has expired.");
  return {
    userName: updated.userId?.name || "Customer",
    reward: updated.rewardSnapshot,
    redeemCode: updated.redeemCode,
    status: updated.status,
  };
}

module.exports = {
  DEMO_SLUG,
  checkIn,
  dashboard,
  getPublicInfo,
  myRewards,
  redeem,
  regenerateCode,
  setBudget,
  spin,
  updateRewards,
};
