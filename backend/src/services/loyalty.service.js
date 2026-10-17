const crypto = require("crypto");
const LoyaltyCafe = require("../models/LoyaltyCafe");
const StampCard = require("../models/StampCard");
const StampEvent = require("../models/StampEvent");
const Reward = require("../models/Reward");
const SpinLog = require("../models/SpinLog");
const StampDailyCounter = require("../models/StampDailyCounter");
const SpinDailyBudget = require("../models/SpinDailyBudget");
const { istDay, nextIstMidnight } = require("../utils/loyaltyDate");

const CARD_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const DEFAULT_PRIZES = [
  { key: "none", label: "Better luck kal", weight: 40, type: "none" },
  { key: "off5", label: "Rs 5 off", weight: 25, type: "discount" },
  { key: "addon", label: "Free add-on", weight: 15, type: "addon" },
  { key: "off10", label: "10% off", weight: 12, type: "discount" },
  { key: "chai", label: "Free Chai", weight: 8, type: "item" },
];

class LoyaltyError extends Error {
  constructor(message, status = 400, code = "loyalty_error") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const makeCode = (length) => {
  let code = "";
  for (let index = 0; index < length; index += 1) code += CARD_ALPHABET[crypto.randomInt(CARD_ALPHABET.length)];
  return code;
};
const tokenHash = (token) => crypto.createHash("sha256").update(token).digest("hex");
const token = () => crypto.randomBytes(32).toString("base64url");
const isDuplicate = (error) => error && error.code === 11000;
const plainCard = (card) => {
  const value = typeof card.toObject === "function" ? card.toObject() : { ...card };
  delete value.tokenHash;
  delete value.__v;
  return value;
};

async function ensureCounter(Model, filter) {
  try {
    await Model.updateOne(filter, { $setOnInsert: { ...filter, count: 0 } }, { upsert: true });
  } catch (error) {
    if (!isDuplicate(error)) throw error;
  }
}

async function reserveCounter(Model, filter, limit) {
  if (limit <= 0) return null;
  await ensureCounter(Model, filter);
  return Model.findOneAndUpdate(
    { ...filter, count: { $lt: limit } },
    { $inc: { count: 1 } },
    { new: true },
  );
}

const resolveCafe = async (slug, Model = LoyaltyCafe) => {
  const cafe = await Model.findOne({ slug, active: true }).lean();
  if (!cafe) throw new LoyaltyError("Loyalty trial is unavailable.", 404, "cafe_not_found");
  return cafe;
};

const issueReward = async ({ cafe, card, source, label, expiryDays, now, Model = Reward }) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await Model.create({
        code: makeCode(8),
        cafeSlug: cafe.slug,
        cardId: card._id,
        source,
        label,
        status: "active",
        expiresAt: new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000),
        createdAt: now,
      });
    } catch (error) {
      if (!isDuplicate(error)) throw error;
    }
  }
  throw new LoyaltyError("Could not create a reward code. Please try again.", 503, "reward_code_unavailable");
};

const activeRewards = async (slug, cardId, now = new Date(), Model = Reward) => {
  await Model.updateMany(
    { cafeSlug: slug, cardId, status: "active", expiresAt: { $lte: now } },
    { $set: { status: "expired" } },
  );
  return Model.find({
    cafeSlug: slug,
    cardId,
    status: "active",
    expiresAt: { $gt: now },
  }).sort({ createdAt: -1 }).lean();
};

const createCard = async ({ slug, name, phone, now = new Date(), models = {} }) => {
  const Cafe = models.LoyaltyCafe || LoyaltyCafe;
  const Card = models.StampCard || StampCard;
  const cafe = await resolveCafe(slug, Cafe);
  const cleanName = typeof name === "string" ? name.trim().slice(0, 60) : "";
  const cleanPhone = typeof phone === "string" ? phone.trim() : "";
  if (!cleanName) throw new LoyaltyError("Enter your name.");
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) throw new LoyaltyError("Enter a valid 10-digit Indian mobile number.");
  // TODO: Verify phone ownership with OTP before treating this card identity as verified.
  if (await Card.exists({ cafeSlug: cafe.slug, phone: cleanPhone })) {
    throw new LoyaltyError("A card already exists for this phone number.", 409, "card_exists");
  }

  const cardToken = token();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const card = await Card.create({
        cafeSlug: cafe.slug,
        name: cleanName,
        phone: cleanPhone,
        cardCode: makeCode(6),
        tokenHash: tokenHash(cardToken),
      });
      return { card: plainCard(card), cardToken };
    } catch (error) {
      if (isDuplicate(error) && error.keyPattern && error.keyPattern.cardCode && attempt < 4) continue;
      if (isDuplicate(error) && error.keyPattern && error.keyPattern.phone) {
        throw new LoyaltyError("A card already exists for this phone number.", 409, "card_exists");
      }
      throw error;
    }
  }
  throw new LoyaltyError("Could not create a card. Please try again.", 503, "card_code_unavailable");
};

const findTokenCard = async (slug, cardToken, models = {}) => {
  if (typeof cardToken !== "string" || cardToken.length < 32 || cardToken.length > 100) {
    throw new LoyaltyError("Card access token is required.", 401, "card_token_required");
  }
  const Card = models.StampCard || StampCard;
  const card = await Card.findOne({ cafeSlug: slug, tokenHash: tokenHash(cardToken) }).lean();
  if (!card) throw new LoyaltyError("This card token is not valid for this cafe.", 401, "invalid_card_token");
  return card;
};

const getCard = async ({ slug, cardToken, now = new Date(), models = {} }) => {
  const cafe = await resolveCafe(slug, models.LoyaltyCafe || LoyaltyCafe);
  const card = await findTokenCard(cafe.slug, cardToken, models);
  const [rewards, spin] = await Promise.all([
    activeRewards(cafe.slug, card._id, now, models.Reward || Reward),
    (models.SpinLog || SpinLog).findOne({ cafeSlug: cafe.slug, cardId: card._id, dayIST: istDay(now) }).lean(),
  ]);
  return {
    cafe: { slug: cafe.slug, name: cafe.name, stampsRequired: cafe.stampsRequired },
    card: plainCard(card),
    rewards,
    spunToday: Boolean(spin),
    nextSpinAt: nextIstMidnight(now),
  };
};

const lookupCard = async ({ slug, cardCode, models = {} }) => {
  const cafe = await resolveCafe(slug, models.LoyaltyCafe || LoyaltyCafe);
  const cleanCode = typeof cardCode === "string" ? cardCode.trim().toUpperCase() : "";
  if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(cleanCode)) {
    throw new LoyaltyError("Enter a valid 6-character card code.");
  }
  const card = await (models.StampCard || StampCard).findOne({ cafeSlug: cafe.slug, cardCode: cleanCode }).lean();
  if (!card) throw new LoyaltyError("Card not found.", 404, "card_not_found");
  return {
    card: plainCard(card),
    rewards: await activeRewards(cafe.slug, card._id, new Date(), models.Reward || Reward),
    stampsRequired: cafe.stampsRequired,
  };
};

const stampCard = async ({ slug, cardCode, now = new Date(), models = {} }) => {
  const Cafe = models.LoyaltyCafe || LoyaltyCafe;
  const Card = models.StampCard || StampCard;
  const Events = models.StampEvent || StampEvent;
  const Daily = models.StampDailyCounter || StampDailyCounter;
  const cafe = await resolveCafe(slug, Cafe);
  const cleanCode = typeof cardCode === "string" ? cardCode.trim().toUpperCase() : "";
  const card = await Card.findOne({ cafeSlug: cafe.slug, cardCode: cleanCode }).lean();
  if (!card) throw new LoyaltyError("Card not found.", 404, "card_not_found");
  const dayIST = istDay(now);
  const counterFilter = { cafeSlug: cafe.slug, cardId: card._id, dayIST };
  const reserved = await reserveCounter(Daily, counterFilter, cafe.dailyStampLimit);
  if (!reserved) throw new LoyaltyError("This card has reached today's stamp limit.", 429, "daily_stamp_limit");

  let event;
  let updatedCard;
  try {
    event = await Events.create({ ...counterFilter, at: now, source: "staff" });
    const nextTotal = { $add: [{ $ifNull: ["$totalStamps", 0] }, 1] };
    const completed = { $eq: [{ $mod: [nextTotal, cafe.stampsRequired] }, 0] };
    updatedCard = await Card.findOneAndUpdate(
      { _id: card._id, cafeSlug: cafe.slug },
      [{
        $set: {
          totalStamps: nextTotal,
          stamps: { $cond: [completed, 0, { $add: [{ $ifNull: ["$stamps", 0] }, 1] }] },
          completedCards: {
            $add: [{ $ifNull: ["$completedCards", 0] }, { $cond: [completed, 1, 0] }],
          },
          updatedAt: now,
        },
      }],
      { new: true, lean: true },
    );
    if (!updatedCard) throw new LoyaltyError("Card not found.", 404, "card_not_found");
  } catch (error) {
    await Daily.updateOne(counterFilter, { $inc: { count: -1 } });
    if (event) await Events.deleteOne({ _id: event._id });
    throw error;
  }

  const completed = updatedCard.totalStamps > 0 && updatedCard.totalStamps % cafe.stampsRequired === 0;
  const reward = completed ? await issueReward({
    cafe,
    card: updatedCard,
    source: "stamp",
    label: cafe.stampRewardLabel || "Free Chai",
    expiryDays: cafe.rewardExpiryDays,
    now,
    Model: models.Reward || Reward,
  }) : null;
  return { card: plainCard(updatedCard), completed, reward };
};

const weightedPrize = (prizes) => {
  const valid = (Array.isArray(prizes) && prizes.length ? prizes : DEFAULT_PRIZES)
    .filter((prize) => Number.isInteger(prize.weight) && prize.weight > 0 && typeof prize.key === "string");
  const total = valid.reduce((sum, prize) => sum + prize.weight, 0);
  if (!total) return DEFAULT_PRIZES[0];
  let draw = crypto.randomInt(total);
  for (const prize of valid) {
    if (draw < prize.weight) return prize;
    draw -= prize.weight;
  }
  return valid[valid.length - 1];
};

const spin = async ({ slug, cardToken, now = new Date(), models = {} }) => {
  const Cafe = models.LoyaltyCafe || LoyaltyCafe;
  const Card = models.StampCard || StampCard;
  const Logs = models.SpinLog || SpinLog;
  const Budget = models.SpinDailyBudget || SpinDailyBudget;
  const Rewards = models.Reward || Reward;
  const cafe = await resolveCafe(slug, Cafe);
  const card = await findTokenCard(cafe.slug, cardToken, models);
  const dayIST = istDay(now);
  let log;
  try {
    log = await Logs.create({ cafeSlug: cafe.slug, cardId: card._id, dayIST, prizeKey: "pending" });
  } catch (error) {
    if (isDuplicate(error)) throw new LoyaltyError("Aaj ka spin ho chuka hai. Kal phir try karein.", 409, "already_spun");
    throw error;
  }

  let prize = weightedPrize(cafe.prizes);
  let reward = null;
  if (prize.key !== "none") {
    const budgetFilter = { cafeSlug: cafe.slug, dayIST };
    const reserved = await reserveCounter(Budget, budgetFilter, cafe.dailyRewardBudget);
    if (!reserved) prize = { key: "none", label: "Today's reward budget is finished. Better luck kal!", type: "none" };
  }

  try {
    if (prize.key !== "none") {
      reward = await issueReward({
        cafe,
        card,
        source: "spin",
        label: prize.label,
        expiryDays: 3,
        now,
        Model: Rewards,
      });
    }
    await Logs.updateOne({ _id: log._id }, { $set: { prizeKey: prize.key, rewardId: reward ? reward._id : null } });
  } catch (error) {
    if (prize.key !== "none") {
      await Budget.updateOne({ cafeSlug: cafe.slug, dayIST }, { $inc: { count: -1 } });
    }
    await Logs.updateOne({ _id: log._id }, { $set: { prizeKey: "none", rewardId: null } });
    throw error;
  }
  return { prize: { key: prize.key, label: prize.label }, reward, nextSpinAt: nextIstMidnight(now) };
};

const redeem = async ({ slug, code, now = new Date(), models = {} }) => {
  const cafe = await resolveCafe(slug, models.LoyaltyCafe || LoyaltyCafe);
  const cleanCode = typeof code === "string" ? code.trim().toUpperCase() : "";
  if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(cleanCode)) throw new LoyaltyError("Enter a valid 8-character reward code.");
  const Rewards = models.Reward || Reward;
  const reward = await Rewards.findOneAndUpdate(
    { cafeSlug: cafe.slug, code: cleanCode, status: "active", expiresAt: { $gt: now } },
    { $set: { status: "used", usedAt: now } },
    { new: false },
  ).lean();
  if (!reward) {
    await Rewards.updateOne(
      { cafeSlug: cafe.slug, code: cleanCode, status: "active", expiresAt: { $lte: now } },
      { $set: { status: "expired" } },
    );
    throw new LoyaltyError("Reward is invalid, expired, or already used.", 409, "reward_unavailable");
  }
  return { reward: { ...reward, status: "used", usedAt: now } };
};

const demoReset = async ({ slug, cardCode, now = new Date(), models = {} }) => {
  const cafe = await resolveCafe(slug, models.LoyaltyCafe || LoyaltyCafe);
  if (!cafe.isDemo) throw new LoyaltyError("Demo reset is only available for the trial cafe.", 403, "demo_only");
  const Card = models.StampCard || StampCard;
  const card = await Card.findOne({ cafeSlug: cafe.slug, cardCode: String(cardCode || "").trim().toUpperCase() }).lean();
  if (!card) throw new LoyaltyError("Card not found.", 404, "card_not_found");
  const filter = { cafeSlug: cafe.slug, cardId: card._id, dayIST: istDay(now) };
  await Promise.all([
    (models.StampEvent || StampEvent).deleteMany(filter),
    (models.SpinLog || SpinLog).deleteOne(filter),
    (models.StampDailyCounter || StampDailyCounter).deleteOne(filter),
  ]);
  return { card: plainCard(card), resetDay: filter.dayIST };
};

module.exports = {
  CARD_ALPHABET,
  DEFAULT_PRIZES,
  LoyaltyError,
  activeRewards,
  createCard,
  demoReset,
  findTokenCard,
  getCard,
  istDay,
  lookupCard,
  nextIstMidnight,
  redeem,
  resolveCafe,
  spin,
  stampCard,
  tokenHash,
  weightedPrize,
};
