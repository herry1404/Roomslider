const { z } = require("zod");
const Room = require("../models/room.model");
const { ensurePublicSlugs } = require("../utils/publicSlug");
const { sanitizeRoomListing } = require("../utils/maskListingPhoneNumbers");
const {
  buildAssistantRoomQuery,
  extractAssistantFilters,
} = require("../services/aiAssistant.service");

const assistantMessageSchema = z.object({
  message: z.string().trim().min(1).max(300),
});

function isHinglish(message) {
  return /[\u0900-\u097f]|\b(chahiye|mujhe|hai|hain|ke paas|ladki|ladkiyon|boys|kaisa|karo|batao|mein|milega)\b/i
    .test(message);
}

function makeReply(message, rooms, filters, total) {
  if (total === 0) {
    if (isHinglish(message)) {
      return "Is search mein abhi room nahi mila. Budget ya area thoda badal kar try karein.";
    }
    return "I couldn't find a room for that search. Try loosening your budget or area.";
  }

  const prices = rooms.map((room) => Number(room.price)).filter(Number.isFinite);
  const lowestPrice = prices.length ? Math.min(...prices) : null;
  const categoryCounts = rooms.reduce((counts, room) => {
    if (room.category) counts[room.category] = (counts[room.category] || 0) + 1;
    return counts;
  }, {});
  const category = filters.category || Object.entries(categoryCounts)
    .sort((left, right) => right[1] - left[1])[0]?.[0];
  const area = filters.area || rooms.find((room) => room.location)?.location;
  const priceText = lowestPrice === null ? null : `₹${lowestPrice.toLocaleString("en-IN")}`;
  const categoryLabel = category === "Room"
    ? (total === 1 ? "room" : "rooms")
    : category === "PG"
      ? (total === 1 ? "PG" : "PGs")
      : category
        ? `${category}${total === 1 ? "" : "s"}`
        : (total === 1 ? "room" : "rooms");

  if (isHinglish(message)) {
    const foundCount = `${total}`;
    const firstLine = `Aapke liye ${foundCount} ${categoryLabel} mile.`;
    const details = [
      priceText && `Sabse sasta ${priceText}`,
      area,
    ].filter(Boolean).join(", ");
    return `${firstLine}${details ? ` ${details}.` : ""} Neeche dekho.`;
  }
  const details = [
    priceText && `lowest price ${priceText}`,
    area,
  ].filter(Boolean).join(", ");
  return `Found ${total} ${categoryLabel}${details ? `; ${details}` : ""}. See below.`;
}

function roomCard(room) {
  const categoryPaths = { Room: "rooms", PG: "pg", Hostel: "hostels", Flat: "flats" };
  const path = categoryPaths[room.category] || "rooms";
  return {
    type: "room",
    title: room.title,
    subtitle: [room.sharingType, room.gender === "Female" ? "Girls" : room.gender === "Male" ? "Boys" : null]
      .filter(Boolean)
      .join(" · ") || room.category,
    category: room.category,
    price: room.price,
    image: room.images?.[0] || null,
    location: room.location,
    link: `/${path}/${room.slug || room._id}`,
  };
}

async function postAssistantMessage(req, res) {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      success: false,
      message: "AI Room Finder abhi available nahi hai. Please thodi der baad try karein.",
    });
  }
  const parsed = assistantMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Please enter a message of up to 300 characters.",
    });
  }

  try {
    const { message } = parsed.data;
    const filters = await extractAssistantFilters(message);
    const query = buildAssistantRoomQuery(filters);
    const [rooms, total] = await Promise.all([
      Room.find(query)
        .select("_id title slug category price location images gender sharingType")
        .sort({ priority: 1, createdAt: -1 })
        .limit(6),
      Room.countDocuments(query),
    ]);

    await ensurePublicSlugs(Room, rooms, (room) => room.title);
    const publicRooms = rooms.map((room) => sanitizeRoomListing(room));
    const results = publicRooms.map(roomCard);
    const searchTerm = filters.area || filters.college || filters.category || "";
    const viewAllLink = `/rooms${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}`;

    return res.status(200).json({
      reply: makeReply(message, publicRooms, filters, total),
      intent: "room_search",
      filters,
      results,
      cards: results,
      rooms: publicRooms,
      total,
      hasMore: total > results.length,
      viewAllLink,
    });
  } catch (error) {
    console.error("AI ROOM ASSISTANT REQUEST FAILED:", error.message);
    return res.status(500).json({
      success: false,
      message: "Room search abhi complete nahi ho paayi. Please dobara try karein.",
    });
  }
}

module.exports = { makeReply, postAssistantMessage, roomCard };
