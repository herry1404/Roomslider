const {
  PUBLIC_ROOM_CATEGORIES,
  findPublicRoomListings,
} = require("./publicRoomListings.service");
const { maskPhoneNumbers } = require("../utils/maskListingPhoneNumbers");

const CATEGORY_PATHS = {
  Room: "rooms",
  PG: "pg",
  Hostel: "hostels",
  Flat: "flats",
};
const MENU_TEXT =
  "RoomSlider helps you find rooms and stays in Indore. Choose an option below to explore public listings.";
const SUPPORT_TEXT =
  "For support, please visit the RoomSlider website. We do not share personal contact details through this bot.";
const CHAT_LIMIT = 20;
const CHAT_WINDOW_MS = 60_000;

function menuKeyboard(siteUrl = "https://roomslider.in") {
  return {
    inline_keyboard: [
      [
        { text: "Latest Rooms", callback_data: "browse:all:0" },
        { text: "PGs", callback_data: "browse:PG:0" },
      ],
      [
        { text: "Hostels", callback_data: "browse:Hostel:0" },
        { text: "Flats", callback_data: "browse:Flat:0" },
      ],
      [
        { text: "Search by Area", callback_data: "search:area" },
        { text: "Support", callback_data: "support" },
      ],
      [{ text: "Open Website", url: siteUrl }],
    ],
  };
}

function cleanText(value, maxLength = 180) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength);
}

function listingUrl(room, siteUrl) {
  const section = CATEGORY_PATHS[room.category] || "rooms";
  const slug = cleanText(room.slug || room.title, 100);
  return new URL(`/${section}/${encodeURIComponent(slug)}`, siteUrl).toString();
}

function formatListings(rooms, category, page, siteUrl) {
  if (!rooms.length) {
    return {
      text: "No public vacant listings found for that search. Try another area or category.",
      reply_markup: menuKeyboard(siteUrl),
    };
  }

  const visibleRooms = rooms.slice(0, 5);
  const labels = visibleRooms.map((room, index) => {
    const title = cleanText(maskPhoneNumbers(room.title), 100) || "Room listing";
    const area = cleanText(maskPhoneNumbers(room.location), 100) || "Location not specified";
    const type = cleanText(room.category, 30) || "Room";
    const price = Number.isFinite(Number(room.price)) ? `₹${Number(room.price).toLocaleString("en-IN")}` : "Price on request";
    return `${index + 1}. ${title}\n${type} · ${area}\n${price}/month`;
  });
  const buttons = visibleRooms.map((room) => [
    { text: `View ${cleanText(maskPhoneNumbers(room.title), 45) || "listing"}`, url: listingUrl(room, siteUrl) },
  ]);
  if (rooms.length > 5) {
    const nextCategory = PUBLIC_ROOM_CATEGORIES.includes(category) ? category : "all";
    buttons.push([{ text: "More", callback_data: `page:${nextCategory}:${page + 1}` }]);
  }
  return {
    text: labels.join("\n\n"),
    reply_markup: { inline_keyboard: buttons },
  };
}

function createTelegramBot({
  findListings = findPublicRoomListings,
  sendMessage = defaultSendMessage,
  answerCallbackQuery = defaultAnswerCallback,
  env = process.env,
  now = Date.now,
  logger = console,
} = {}) {
  const chats = new Map();
  const pendingAreaSearch = new Set();

  async function send(chatId, text, replyMarkup) {
    return sendMessage(chatId, text, replyMarkup);
  }

  async function showMenu(chatId, text = MENU_TEXT) {
    await send(chatId, text, menuKeyboard(env.SITE_URL || "https://roomslider.in"));
  }

  async function browse(chatId, category, page = 0, search) {
    try {
      const safePage = Math.min(10_000, Math.max(0, Number.parseInt(page, 10) || 0));
      const rooms = await findListings({
        category: category === "all" ? undefined : category,
        search,
        page: safePage,
        limit: 6,
      });
      const response = formatListings(
        rooms,
        category,
        safePage,
        env.SITE_URL || "https://roomslider.in",
      );
      await send(chatId, response.text, response.reply_markup);
    } catch {
      logger.error("Telegram bot listing lookup failed");
      await send(chatId, "Sorry, listings are temporarily unavailable. Please try again later.");
    }
  }

  function allowChat(chatId) {
    const timestamp = now();
    const recent = (chats.get(String(chatId)) || []).filter((time) => timestamp - time < CHAT_WINDOW_MS);
    if (recent.length >= CHAT_LIMIT) {
      chats.set(String(chatId), recent);
      return false;
    }
    recent.push(timestamp);
    chats.set(String(chatId), recent);
    if (chats.size > 10_000) {
      for (const [key, timestamps] of chats) {
        if (!timestamps.some((time) => timestamp - time < CHAT_WINDOW_MS)) chats.delete(key);
        if (chats.size <= 8_000) break;
      }
    }
    return true;
  }

  async function handleUpdate(update) {
    if (!update || typeof update !== "object") return;

    const message = update.message;
    const callback = update.callback_query;
    const user = message?.from || callback?.from;
    if (user?.is_bot) return;
    const chatId = message?.chat?.id ?? callback?.message?.chat?.id;
    if (chatId === undefined || chatId === null) return;

    if (!allowChat(chatId)) {
      if (callback?.id) {
        try { await answerCallbackQuery(callback.id); } catch {
          logger.error("Telegram callback acknowledgement failed");
        }
      }
      return;
    }

    if (callback) {
      try { await answerCallbackQuery(callback.id); } catch {
        logger.error("Telegram callback acknowledgement failed");
      }
      const data = String(callback.data || "");
      const browseMatch = data.match(/^(?:browse|page):(all|Room|PG|Hostel|Flat):(\d{1,6})$/);
      if (browseMatch) return browse(chatId, browseMatch[1], Number(browseMatch[2]));
      const searchMatch = data.match(/^search:([^:]{1,50})$/);
      if (searchMatch) {
        if (searchMatch[1] === "area") {
          pendingAreaSearch.add(String(chatId));
          return send(chatId, "Type an area or college name in Indore (for example, Vijay Nagar or Bhawarkua).");
        }
        return browse(chatId, undefined, 0, searchMatch[1]);
      }
      if (data === "support") return send(chatId, SUPPORT_TEXT, {
        inline_keyboard: [[{ text: "Open RoomSlider", url: env.SITE_URL || "https://roomslider.in" }]],
      });
      return;
    }

    const text = typeof message?.text === "string" ? message.text.slice(0, 1000).trim() : "";
    if (!text) {
      pendingAreaSearch.delete(String(chatId));
      return showMenu(chatId);
    }
    const command = text.split(/\s+/, 1)[0].split("@", 1)[0].toLowerCase();
    const separator = text.indexOf(" ");
    const argument = separator === -1 ? "" : text.slice(separator + 1).trim().slice(0, 50);
    if (text.startsWith("/") && command !== "/search") pendingAreaSearch.delete(String(chatId));
    if (command === "/start" || command === "/help") return showMenu(chatId);
    if (command === "/support") {
      return send(chatId, SUPPORT_TEXT, {
        inline_keyboard: [[{ text: "Open RoomSlider", url: env.SITE_URL || "https://roomslider.in" }]],
      });
    }
    if (command === "/rooms") return browse(chatId);
    if (command === "/search") {
      if (!argument) return showMenu(chatId);
      pendingAreaSearch.delete(String(chatId));
      return browse(chatId, undefined, 0, argument);
    }
    if (pendingAreaSearch.has(String(chatId)) && !text.startsWith("/")) {
      pendingAreaSearch.delete(String(chatId));
      const search = text.slice(0, 50).trim();
      if (!search) return showMenu(chatId);
      return browse(chatId, undefined, 0, search);
    }
    return showMenu(chatId, "I didn't understand that. Choose an option below to continue.");
  }

  return { handleUpdate };
}

async function defaultSendMessage(chatId, text, replyMarkup) {
  const token = process.env.TELEGRAM_USER_BOT_TOKEN;
  if (!token) throw new Error("User-facing Telegram bot is not configured");
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup }),
    signal: AbortSignal.timeout(8000),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(`Telegram API HTTP ${response.status}`);
}

async function defaultAnswerCallback(callbackId) {
  const token = process.env.TELEGRAM_USER_BOT_TOKEN;
  if (!token) return;
  const response = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId }),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Telegram API HTTP ${response.status}`);
}

module.exports = {
  createTelegramBot,
  formatListings,
  listingUrl,
  menuKeyboard,
};
