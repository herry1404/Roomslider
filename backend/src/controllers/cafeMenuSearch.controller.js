const { z } = require("zod");
const { CAFE_MENUS, getLocationFilter, searchCafeMenus } = require("../services/cafeMenuSearch.service");

const requestSchema = z.object({
  message: z.string().trim().min(1).max(300),
  location: z.string().trim().max(100).optional(),
});

const formatCafeMenuReply = (items, areaName) => items.length
  ? `Menu me ye items mile${areaName ? ` ${areaName} area me` : ""}:\n${items.map((item) => `• ${item.name} — ${item.price || "price listed nahi hai"} · ${item.cafe}, ${item.location}`).join("\n")}`
  : `${areaName ? `${areaName} area ke ` : ""}available cafe menus me matching item nahi mila. Koi aur item ya area try karein.`;

const getConversationalReply = (message) => {
  const normalized = message.trim().toLowerCase().replace(/[.!?,]+$/g, "").trim();
  if (/^(hi+|hello+|hey+|namaste|namaskar|good morning|good afternoon|good evening|how are you)$/.test(normalized)) {
    return {
      intent: "greeting",
      reply: "Hi! 👋 Main RoomSlider Menu AI hoon. Cafe menus me dishes aur prices dhoondhne ke liye item ka naam poochhiye, jaise “pizza” ya “coffee”.",
    };
  }
  if (/\b(who (?:made|made up|built|created|founded)|who is the founder|founder of|creator of|kisne (?:banaya|banai|banaaya|create kiya)|kis ne (?:banaya|banai)|roomslider ke (?:founder|creator)|roomslider kisne)\b/.test(normalized)) {
    return {
      intent: "about_roomslider",
      reply: "RoomSlider do doston ne banaya tha, jab woh students ke roop me naye shehar me room dhoondhne ki mushkil se guzre. Unhone Rooms, PGs, Hostels aur Flats dhoondhna aasan banane ke liye RoomSlider shuru kiya. About page par founders ke naam nahi diye gaye hain.",
    };
  }
  return null;
};

const postCafeMenuSearch = async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: "Enter a menu item to search." });
  }

  if (parsed.data.location && !getLocationFilter(parsed.data.location)) {
    return res.status(400).json({ success: false, message: "Choose a supported cafe area." });
  }

  const conversationalReply = getConversationalReply(parsed.data.message);
  if (conversationalReply) {
    return res.status(200).json({
      success: true,
      ...conversationalReply,
      location: null,
      items: [],
      results: [],
      cards: [],
      groups: [],
      total: 0,
    });
  }

  try {
    const { items, location } = await searchCafeMenus(parsed.data.message, {
      location: parsed.data.location,
    });
    const areaName = location
      ? CAFE_MENUS.find((cafe) => cafe.location.toLowerCase() === location)?.location || location
      : "";
    const reply = formatCafeMenuReply(items, areaName);
    const cards = items.map((item) => ({
      type: "cafe",
      title: item.name,
      category: `${item.cafe} · ${item.price || "Price not listed"}`,
      subtitle: item.category,
      location: item.location,
      link: new URL(item.menuUrl).pathname,
    }));

    return res.status(200).json({
      success: true,
      reply,
      intent: "cafe_menu_search",
      location: areaName || null,
      items,
      results: cards,
      cards,
      groups: cards.length ? [{ label: "Cafe menu matches", results: cards }] : [],
      total: items.length,
    });
  } catch (error) {
    console.error("CAFE MENU SEARCH FAILED:", error.message);
    return res.status(503).json({
      success: false,
      message: "Cafe menus are temporarily unavailable. Please try again shortly.",
    });
  }
};

module.exports = { formatCafeMenuReply, getConversationalReply, postCafeMenuSearch };
