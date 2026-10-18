const { randomInt, randomBytes } = require("crypto");
const Cafe = require("../models/Cafe");
const DailyCode = require("../models/DailyCode");
const CheckIn = require("../models/CheckIn");
const Spin = require("../models/Spin");
const User = require("../models/user.model");
const Owner = require("../models/Owner");
const Sponsor = require("../models/Sponsor");
const Coupon = require("../models/Coupon");
const CouponClaim = require("../models/CouponClaim");
const AdView = require("../models/AdView");
const { providers } = require("./adProviders");
const { tryClaimCouponStock } = require("../utils/couponRules");
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

function makeAdToken() {
  return randomBytes(24).toString("base64url");
}

function assertRewardsUser(user) {
  if (!user || !["user", "admin"].includes(user.role)) {
    fail(403, "A customer account is required for rewards.");
  }
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

  const [todayCheckIn, spins, latest] = await Promise.all([
    CheckIn.findOne({ cafeId: cafe._id, userId: user._id, dateKey: today }),
    Spin.find({ cafeId: cafe._id, userId: user._id, dateKey: today }),
    latestCheckIn(cafe._id, user._id),
  ]);
  const yesterday = addDaysToDateKey(today, -1);
  const streak = todayCheckIn
    ? todayCheckIn.streak
    : latest && latest.dateKey === yesterday
      ? latest.streak
      : 0;
  const spinsByType = new Map(spins.map((spin) => [spin.type || "cafe", spin]));
  const formatSpin = (spin) => spin ? {
    reward: spin.rewardSnapshot,
    redeemCode: spin.redeemCode,
    coupon: spin.couponId ? spin.couponSnapshot : null,
    status: spin.status,
    expiresAt: spin.expiresAt,
  } : null;
  const cafeSpin = spinsByType.get("cafe");
  return {
    ...data,
    user: {
      streak,
      checkedInToday: Boolean(todayCheckIn),
      spunToday: Boolean(cafeSpin),
      todaySpin: formatSpin(cafeSpin),
      spins: {
        cafe: formatSpin(cafeSpin),
        ad: formatSpin(spinsByType.get("ad")),
        coupon: formatSpin(spinsByType.get("coupon")),
      },
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

async function reserveSpin({ cafe, user, dateKey, type }) {
  try {
    return await Spin.create({
      cafeId: cafe._id,
      userId: user._id,
      type,
      dateKey,
      rewardSnapshot: { label: "Spin in progress", valueRs: 0, isNoWin: true },
    });
  } catch (error) {
    if (error.code === 11000) fail(409, `You have already used today's ${type === "cafe" ? "cafe " : ""}spin.`);
    throw error;
  }
}

async function finishNoWin(spinRecord) {
  return Spin.findByIdAndUpdate(spinRecord._id, {
    $set: {
      rewardSnapshot: { label: NO_WIN_REWARD.label, valueRs: 0, isNoWin: true },
      redeemCode: null,
      status: null,
      expiresAt: null,
    },
  }, { returnDocument: "after" });
}

async function spinCafe({ slug, user }) {
  assertCompleteProfile(user);
  const cafe = await requireCafe(slug);
  const today = getIndiaDateKey();
  const checkIn = await CheckIn.findOne({ cafeId: cafe._id, userId: user._id, dateKey: today });
  if (!checkIn) fail(403, "Check in with today's cafe code before spinning.");

  const reservation = await reserveSpin({ cafe, user, dateKey: today, type: "cafe" });

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
    await finishNoWin(reservation);
    throw error;
  }
}

async function eligibleCoupons({ kind, sponsorId, userId, now, excludedIds = [] }) {
  const claimedIds = await CouponClaim.distinct("couponId", { userId });
  const blockedIds = [...claimedIds, ...excludedIds];
  return Coupon.find({
    kind,
    ...(sponsorId ? { sponsorId } : {}),
    active: true,
    stock: { $gt: 0 },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    ...(blockedIds.length ? { _id: { $nin: blockedIds } } : {}),
  }).lean();
}

function couponSegments(coupons) {
  return coupons.map((coupon) => ({
    key: String(coupon._id),
    label: coupon.title,
    weight: coupon.weight,
    valueRs: 0,
    isNoWin: false,
  }));
}

async function claimCouponForSpin({ spinRecord, kind, sponsorId, userId }) {
  const now = new Date();
  const excludedIds = [];
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidates = await eligibleCoupons({ kind, sponsorId, userId, now, excludedIds });
    if (!candidates.length) return { coupon: null, segments: [] };
    const selected = chooseWeightedReward(candidates);
    excludedIds.push(selected._id);
    const coupon = await tryClaimCouponStock(Coupon, selected._id, now);
    if (!coupon) continue;
    try {
      await CouponClaim.create({ couponId: coupon._id, userId, spinId: spinRecord._id });
      return { coupon, segments: couponSegments(candidates) };
    } catch (error) {
      // A user can never receive the same coupon twice. Put its stock back if
      // another request claimed it first, then select from the remaining pool.
      if (error.code !== 11000) throw error;
      await Coupon.updateOne(
        { _id: coupon._id, claimed: { $gt: 0 } },
        { $inc: { stock: 1, claimed: -1 } }
      );
    }
  }
  return { coupon: null, segments: [] };
}

async function spinCoupon({ cafe, user, type, sponsorId = null, adView = null }) {
  const today = getIndiaDateKey();
  const reservation = await reserveSpin({ cafe, user, dateKey: today, type });
  let claimedCoupon = null;
  if (adView) {
    const usedView = await AdView.findOneAndUpdate(
      { _id: adView._id, userId: user._id, cafeId: cafe._id, dateKey: today, completedAt: { $ne: null }, spinUsed: false },
      { $set: { spinUsed: true } },
      { returnDocument: "after" }
    );
    if (!usedView) {
      await Spin.deleteOne({ _id: reservation._id });
      fail(403, "Watch a complete sponsor ad before using this spin.");
    }
  }
  try {
    const { coupon, segments } = await claimCouponForSpin({
      spinRecord: reservation,
      kind: type === "ad" ? "local" : "online",
      sponsorId,
      userId: user._id,
    });
    if (!coupon) {
      const noWin = await finishNoWin(reservation);
      return {
        reward: noWin.rewardSnapshot,
        redeemCode: null,
        coupon: null,
        status: null,
        expiresAt: null,
        segmentKey: NO_WIN_KEY,
        segments: [NO_WIN_REWARD],
      };
    }
    claimedCoupon = coupon;
    const updated = await Spin.findByIdAndUpdate(reservation._id, {
      $set: {
        couponId: coupon._id,
        couponSnapshot: {
          brand: coupon.brand,
          title: coupon.title,
          code: coupon.code,
          link: coupon.link,
          terms: coupon.terms,
          expiresAt: coupon.expiresAt,
        },
        rewardSnapshot: { label: coupon.title, valueRs: 0, isNoWin: false },
        expiresAt: coupon.expiresAt,
      },
    }, { returnDocument: "after", runValidators: true });
    return {
      reward: updated.rewardSnapshot,
      redeemCode: null,
      coupon: updated.couponSnapshot,
      status: null,
      expiresAt: updated.expiresAt,
      segmentKey: String(coupon._id),
      segments: segments.length ? segments : couponSegments([coupon]),
    };
  } catch (error) {
    if (claimedCoupon) {
      await CouponClaim.deleteOne({ couponId: claimedCoupon._id, userId: user._id, spinId: reservation._id });
      await Coupon.updateOne(
        { _id: claimedCoupon._id, claimed: { $gt: 0 } },
        { $inc: { stock: 1, claimed: -1 } }
      );
    }
    await finishNoWin(reservation);
    throw error;
  }
}

async function spin({ slug, user, type = "cafe" }) {
  assertRewardsUser(user);
  if (!["cafe", "ad", "coupon"].includes(type)) fail(400, "Choose cafe, ad, or coupon spin.");
  if (type === "cafe") return spinCafe({ slug, user });
  const cafe = await requireCafe(slug);
  if (type === "coupon") return spinCoupon({ cafe, user, type });
  const today = getIndiaDateKey();
  const adView = await AdView.findOne({
    userId: user._id,
    cafeId: cafe._id,
    dateKey: today,
    completedAt: { $ne: null },
    spinUsed: false,
  }).sort({ completedAt: -1 }).populate("sponsorId");
  if (!adView || !adView.sponsorId) fail(403, "Watch a complete sponsor ad before using this spin.");
  return spinCoupon({ cafe, user, type, sponsorId: adView.sponsorId._id, adView });
}

async function startAd({ slug, user }) {
  assertRewardsUser(user);
  const cafe = await requireCafe(slug);
  const sponsor = providers.local.start(await Sponsor.find({ active: true }));
  if (!sponsor) fail(404, "No sponsor ad is available right now.");
  const adView = await AdView.create({
    userId: user._id,
    cafeId: cafe._id,
    sponsorId: sponsor._id,
    dateKey: getIndiaDateKey(),
    token: makeAdToken(),
    startedAt: new Date(),
  });
  return {
    token: adView.token,
    provider: "local",
    sponsor: { name: sponsor.name, videoUrl: sponsor.videoUrl || "", durationSec: sponsor.durationSec },
  };
}

async function completeAd({ slug, user, token }) {
  assertRewardsUser(user);
  if (typeof token !== "string" || token.length < 20) fail(400, "Invalid ad token.");
  const cafe = await requireCafe(slug);
  const adView = await AdView.findOne({
    token,
    userId: user._id,
    cafeId: cafe._id,
    dateKey: getIndiaDateKey(),
  }).populate("sponsorId");
  if (!adView || !adView.sponsorId) fail(404, "Ad view not found.");
  if (adView.completedAt) return { completed: true };
  if (!providers.local.complete(adView, new Date())) {
    fail(409, "Please watch at least 90% of the sponsor ad before spinning.");
  }
  const completed = await AdView.findOneAndUpdate(
    { _id: adView._id, completedAt: null },
    { $set: { completedAt: new Date() } },
    { returnDocument: "after" }
  );
  return { completed: Boolean(completed || adView.completedAt) };
}

async function myRewards(user) {
  assertRewardsUser(user);
  const now = new Date();
  await Spin.updateMany(
    { userId: user._id, type: "cafe", status: "unused", expiresAt: { $lte: now } },
    { $set: { status: "expired" } }
  );
  const spins = await Spin.find({
    userId: user._id,
    $or: [{ redeemCode: { $ne: null } }, { couponId: { $ne: null } }],
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("cafeId", "name slug");
  return {
    rewards: spins.map((spinRecord) => ({
      cafe: spinRecord.cafeId ? { name: spinRecord.cafeId.name, slug: spinRecord.cafeId.slug } : null,
      reward: spinRecord.rewardSnapshot,
      type: spinRecord.type || "cafe",
      redeemCode: spinRecord.redeemCode,
      coupon: spinRecord.couponId ? spinRecord.couponSnapshot : null,
      status: spinRecord.status,
      expiresAt: spinRecord.couponId ? spinRecord.couponSnapshot?.expiresAt : spinRecord.expiresAt,
      createdAt: spinRecord.createdAt,
    })),
  };
}

function requireAdmin(user) {
  if (!user || user.role !== "admin") fail(403, "Admin access is required.");
}

function cleanText(value, field, maxLength, { required = true } = {}) {
  const text = typeof value === "string" ? value.trim() : "";
  if ((required && !text) || text.length > maxLength) fail(400, `Enter a valid ${field}.`);
  return text;
}

function cleanOptionalUrl(value) {
  const url = cleanText(value, "URL", 2048, { required: false });
  if (url && !/^https?:\/\//i.test(url)) fail(400, "URL must start with http:// or https://.");
  return url;
}

function cleanSponsor(fields) {
  const durationSec = Number(fields?.durationSec);
  if (!Number.isInteger(durationSec) || durationSec < 10 || durationSec > 15) {
    fail(400, "Sponsor duration must be between 10 and 15 seconds.");
  }
  const videoUrl = cleanOptionalUrl(fields?.videoUrl);
  if (!videoUrl && durationSec !== 10) {
    fail(400, "Text/image sponsor cards use a 10-second countdown.");
  }
  return {
    name: cleanText(fields?.name, "sponsor name", 100),
    videoUrl,
    durationSec,
    active: fields?.active !== false,
  };
}

async function cleanCoupon(fields) {
  const kind = fields?.kind;
  if (!["local", "online"].includes(kind)) fail(400, "Coupon kind must be local or online.");
  const stock = Number(fields?.stock);
  const weight = Number(fields?.weight);
  if (!Number.isSafeInteger(stock) || stock < 0 || !Number.isSafeInteger(weight) || weight < 1 || weight > 1000000) {
    fail(400, "Coupon stock and weight must be valid whole numbers.");
  }
  let sponsorId = null;
  if (kind === "local") {
    sponsorId = fields?.sponsorId;
    if (!sponsorId || !await Sponsor.exists({ _id: sponsorId })) fail(400, "Choose a valid sponsor for a local coupon.");
  }
  let expiresAt = null;
  if (fields?.expiresAt) {
    expiresAt = new Date(fields.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) fail(400, "Enter a valid coupon expiry date.");
  }
  return {
    kind,
    sponsorId,
    brand: cleanText(fields?.brand, "brand", 100),
    title: cleanText(fields?.title, "coupon title", 160),
    code: cleanText(fields?.code, "coupon code", 80).toUpperCase(),
    link: cleanOptionalUrl(fields?.link),
    terms: cleanText(fields?.terms, "terms", 1000, { required: false }),
    expiresAt,
    stock,
    weight,
    active: fields?.active !== false,
  };
}

async function adminCatalog(user) {
  requireAdmin(user);
  const [sponsors, coupons] = await Promise.all([
    Sponsor.find().sort({ name: 1 }).lean(),
    Coupon.find().populate("sponsorId", "name").sort({ createdAt: -1 }).lean(),
  ]);
  const sponsorsWithViews = await Promise.all(sponsors.map(async (sponsor) => ({
    ...sponsor,
    adViews: await AdView.countDocuments({ sponsorId: sponsor._id }),
  })));
  return { sponsors: sponsorsWithViews, coupons };
}

async function createSponsor({ user, fields }) {
  requireAdmin(user);
  return { sponsor: await Sponsor.create(cleanSponsor(fields)) };
}

async function updateSponsor({ user, id, fields }) {
  requireAdmin(user);
  const sponsor = await Sponsor.findByIdAndUpdate(id, { $set: cleanSponsor(fields) }, {
    returnDocument: "after", runValidators: true,
  });
  if (!sponsor) fail(404, "Sponsor not found.");
  return { sponsor };
}

async function createCoupon({ user, fields }) {
  requireAdmin(user);
  return { coupon: await Coupon.create(await cleanCoupon(fields)) };
}

async function updateCoupon({ user, id, fields }) {
  requireAdmin(user);
  const coupon = await Coupon.findByIdAndUpdate(id, { $set: await cleanCoupon(fields) }, {
    returnDocument: "after", runValidators: true,
  });
  if (!coupon) fail(404, "Coupon not found.");
  return { coupon };
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
  adminCatalog,
  DEMO_SLUG,
  checkIn,
  completeAd,
  createCoupon,
  createSponsor,
  dashboard,
  getPublicInfo,
  myRewards,
  redeem,
  regenerateCode,
  setBudget,
  spin,
  startAd,
  updateCoupon,
  updateRewards,
  updateSponsor,
};
