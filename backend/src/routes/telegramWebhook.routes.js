const crypto = require("node:crypto");
const express = require("express");
const rateLimit = require("express-rate-limit");
const { createTelegramBot } = require("../services/telegramBot.service");

function hasValidSecret(provided, expected) {
  if (typeof provided !== "string" || typeof expected !== "string" || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

function createTelegramWebhookRouter({
  bot = createTelegramBot(),
  env = process.env,
  logger = console,
  limiter,
} = {}) {
  const router = express.Router();
  router.use(limiter || rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }));
  router.use(express.json({ limit: "16kb" }));
  router.use((error, req, res, next) => {
    if (error instanceof SyntaxError || error.status === 413) {
      return res.status(error.status === 413 ? 413 : 400)
        .json({ success: false, message: "Invalid webhook payload" });
    }
    return next(error);
  });

  router.post("/", (req, res) => {
    if (!env.TELEGRAM_USER_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) {
      return res.status(503).json({ success: false, message: "Telegram bot is not configured" });
    }
    if (!hasValidSecret(req.get("X-Telegram-Bot-Api-Secret-Token"), env.TELEGRAM_WEBHOOK_SECRET)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const update = req.body;
    res.once("finish", () => {
      setImmediate(() => {
        Promise.resolve(bot.handleUpdate(update)).catch(() => {
          logger.error("Telegram webhook update failed");
        });
      });
    });
    res.sendStatus(200);
  });

  return router;
}

module.exports = createTelegramWebhookRouter();
module.exports.createTelegramWebhookRouter = createTelegramWebhookRouter;
module.exports.hasValidSecret = hasValidSecret;
