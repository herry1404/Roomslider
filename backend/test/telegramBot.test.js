const assert = require("node:assert/strict");
const test = require("node:test");
const express = require("express");
const rateLimit = require("express-rate-limit");
const { createTelegramBot } = require("../src/services/telegramBot.service");
const { createTelegramWebhookRouter } = require("../src/routes/telegramWebhook.routes");
const Room = require("../src/models/room.model");
const { findPublicRoomListings, buildPublicRoomFilter } = require("../src/services/publicRoomListings.service");

const LISTING = {
  title: "Sunny room",
  price: 12000,
  location: "Vijay Nagar",
  category: "Room",
  slug: "sunny-room",
  status: "vacant",
};

function mockBot(options = {}) {
  const sent = [];
  const answered = [];
  const bot = createTelegramBot({
    findListings: options.findListings || (async () => [LISTING]),
    sendMessage: options.sendMessage || (async (...args) => sent.push(args)),
    answerCallbackQuery: async (callbackId) => answered.push(callbackId),
    env: { SITE_URL: "https://roomslider.in" },
    logger: { error() {} },
    now: options.now,
  });
  return { bot, sent, answered };
}

function message(text, chatId = 123) {
  return { message: { text, chat: { id: chatId }, from: { id: chatId, is_bot: false } } };
}

test("/start and /help show the RoomSlider menu", async () => {
  const { bot, sent } = mockBot();
  await bot.handleUpdate(message("/start"));
  await bot.handleUpdate(message("/help"));
  assert.equal(sent.length, 2);
  assert.match(sent[0][1], /RoomSlider/);
  assert.equal(sent[0][2].inline_keyboard.flat().length, 7);
});

test("unknown text falls back to menu; empty search shows menu", async () => {
  const { bot, sent } = mockBot();
  await bot.handleUpdate(message("hello"));
  await bot.handleUpdate(message("/search"));
  assert.match(sent[0][1], /didn't understand/i);
  assert.equal(sent[1][2].inline_keyboard.length, 4);
});

test("browse returns at most five public fields and valid website path", async () => {
  let queryOptions;
  const { bot, sent } = mockBot({
    findListings: async (options) => {
      queryOptions = options;
      return Array.from({ length: 6 }, (_, index) => ({
        ...LISTING,
        title: `Room ${index + 1}`,
        slug: `room-${index + 1}`,
        owner: { phone: "9999999999" },
        contact: "8888888888",
        currentTenant: { name: "Private" },
      }));
    },
  });
  await bot.handleUpdate({ callback_query: {
    id: "callback",
    data: "browse:Room:0",
    from: { id: 123, is_bot: false },
    message: { chat: { id: 123 } },
  } });
  assert.equal(queryOptions.category, "Room");
  assert.equal(queryOptions.limit, 6);
  assert.equal(sent[0][1].split("\n\n").length, 5);
  assert.equal(sent[0][2].inline_keyboard.length, 6);
  assert.equal(sent[0][2].inline_keyboard[0][0].url, "https://roomslider.in/rooms/room-1");
  assert.doesNotMatch(sent[0][1], /9999999999|8888888888|Private/);
});

test("search escapes regular expression characters, caps input, and handles no matches", async () => {
  const searches = [];
  const { bot, sent } = mockBot({
    findListings: async ({ search }) => {
      searches.push(search);
      return [];
    },
  });
  await bot.handleUpdate(message(`/search ${"Vijay.*".repeat(10)}`));
  await bot.handleUpdate(message("/search no-such-area"));
  assert.equal(searches[0].length, 50);
  assert.match(sent[0][1], /No public vacant listings/);
});

test("public query shares vacant/category/search filters and selects no owner or private fields", async () => {
  const filter = buildPublicRoomFilter({ category: "PG", search: "A.*B" });
  assert.equal(filter.status, "vacant");
  assert.equal(filter.category, "PG");
  assert.equal(filter.$or[1].location.source, "A\\.\\*B");

  const originalFind = Room.find;
  let selectedFields;
  let queriedFilter;
  Room.find = (query) => {
    queriedFilter = query;
    const chain = {
      select(fields) { selectedFields = fields; return this; },
      sort() { return this; },
      skip() { return this; },
      limit() { return this; },
      lean: async () => [{ ...LISTING }],
    };
    return chain;
  };
  try {
    const listings = await findPublicRoomListings({ category: "PG", search: "A.*B" });
    assert.equal(queriedFilter.status, "vacant");
    assert.equal(queriedFilter.category, "PG");
    assert.doesNotMatch(selectedFields, /owner|contact|tenant|lease|payment/i);
    assert.equal(listings[0].title, LISTING.title);
  } finally {
    Room.find = originalFind;
  }
});

test("Search by Area button captures the next text message", async () => {
  const searches = [];
  const { bot, sent } = mockBot({
    findListings: async ({ search }) => {
      searches.push(search);
      return [LISTING];
    },
  });
  await bot.handleUpdate({ callback_query: {
    id: "search",
    data: "search:area",
    from: { id: 321, is_bot: false },
    message: { chat: { id: 321 } },
  } });
  await bot.handleUpdate(message("Bhawarkua", 321));
  assert.match(sent[0][1], /Type an area/);
  assert.equal(searches[0], "Bhawarkua");
});

test("pagination callback loads the requested next page", async () => {
  const pages = [];
  const { bot, sent, answered } = mockBot({
    findListings: async ({ page }) => {
      pages.push(page);
      return [LISTING];
    },
  });
  await bot.handleUpdate({ callback_query: {
    id: "page-callback",
    data: "page:PG:2",
    from: { id: 123, is_bot: false },
    message: { chat: { id: 123 } },
  } });
  assert.deepEqual(pages, [2]);
  assert.deepEqual(answered, ["page-callback"]);
  assert.equal(sent.length, 1);
});

test("support reply only links to configured website and invents no contacts", async () => {
  const { bot, sent } = mockBot();
  await bot.handleUpdate(message("/support"));
  assert.match(sent[0][1], /visit the RoomSlider website/);
  assert.doesNotMatch(sent[0][1], /@|WhatsApp|tel:/i);
  assert.equal(sent[0][2].inline_keyboard[0][0].url, "https://roomslider.in");
});

test("invalid updates and bot-originated messages are ignored", async () => {
  const { bot, sent } = mockBot();
  await bot.handleUpdate(null);
  await bot.handleUpdate({});
  await bot.handleUpdate({ message: { text: "/start", chat: { id: 1 }, from: { is_bot: true } } });
  assert.equal(sent.length, 0);
});

test("per-chat rate limit allows 20 messages per minute", async () => {
  let clock = 1_000;
  const { bot, sent } = mockBot({ now: () => clock });
  for (let i = 0; i < 21; i += 1) {
    await bot.handleUpdate(message("/start"));
    clock += 1;
  }
  assert.equal(sent.length, 20);
});

test("database failure sends a friendly retry message", async () => {
  const { bot, sent } = mockBot({ findListings: async () => { throw new Error("db unavailable"); } });
  await bot.handleUpdate(message("/rooms"));
  assert.match(sent[0][1], /temporarily unavailable/i);
});

async function withServer(router, run) {
  const app = express();
  app.use("/api/telegram/webhook", router);
  const server = app.listen(0);
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}/api/telegram/webhook`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("webhook returns 503 unconfigured and 401 for missing or wrong secret", async () => {
  const router = createTelegramWebhookRouter({
    env: {},
    bot: { handleUpdate: async () => assert.fail("must not process") },
    logger: { error() {} },
  });
  await withServer(router, async (url) => {
    const unavailable = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    assert.equal(unavailable.status, 503);
  });

  const secured = createTelegramWebhookRouter({
    env: { TELEGRAM_USER_BOT_TOKEN: "configured", TELEGRAM_WEBHOOK_SECRET: "expected-secret" },
    bot: { handleUpdate: async () => assert.fail("must not process") },
    logger: { error() {} },
  });
  await withServer(secured, async (url) => {
    for (const secret of [undefined, "wrong-secret"]) {
      const headers = { "Content-Type": "application/json" };
      if (secret) headers["X-Telegram-Bot-Api-Secret-Token"] = secret;
      const response = await fetch(url, { method: "POST", headers, body: "{}" });
      assert.equal(response.status, 401);
    }
  });
});

test("webhook acknowledges valid unsupported update before asynchronous processing", async () => {
  let handled;
  const router = createTelegramWebhookRouter({
    env: { TELEGRAM_USER_BOT_TOKEN: "configured", TELEGRAM_WEBHOOK_SECRET: "expected-secret" },
    bot: { handleUpdate: async (update) => { handled = update; } },
    logger: { error() {} },
  });
  await withServer(router, async (url) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": "expected-secret",
      },
      body: JSON.stringify({ update_id: 42 }),
    });
    assert.equal(response.status, 200);
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(handled, { update_id: 42 });
  });
});

test("malformed JSON is rejected without processing an update", async () => {
  let handled = false;
  const router = createTelegramWebhookRouter({
    env: { TELEGRAM_USER_BOT_TOKEN: "configured", TELEGRAM_WEBHOOK_SECRET: "expected-secret" },
    bot: { handleUpdate: async () => { handled = true; } },
    logger: { error() {} },
  });
  await withServer(router, async (url) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": "expected-secret",
      },
      body: "{",
    });
    assert.equal(response.status, 400);
    assert.equal(handled, false);
  });
});

test("route-level limiter and Telegram send failures do not crash webhook", async () => {
  const router = createTelegramWebhookRouter({
    env: { TELEGRAM_USER_BOT_TOKEN: "configured", TELEGRAM_WEBHOOK_SECRET: "expected-secret" },
    bot: { handleUpdate: async () => { throw new Error("Telegram send failed"); } },
    limiter: rateLimit({ windowMs: 60_000, limit: 1, standardHeaders: false, legacyHeaders: false }),
    logger: { error() {} },
  });
  await withServer(router, async (url) => {
    const send = () => fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": "expected-secret",
      },
      body: JSON.stringify({ message: { text: "/start" } }),
    });
    const first = await send();
    assert.equal(first.status, 200);
    const limited = await send();
    assert.equal(limited.status, 429);
  });
});
