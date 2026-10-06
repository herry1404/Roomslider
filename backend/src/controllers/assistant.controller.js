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

function makeReply(message, roomCount) {
  if (isHinglish(message)) {
    return roomCount
      ? `${roomCount} matching room${roomCount === 1 ? "" : "s"} mil gaye! Details neeche dekh lo.`
      : "Abhi matching room nahi mila—budget ya area badal kar try karein.";
  }
  return roomCount
    ? `I found ${roomCount} matching room${roomCount === 1 ? "" : "s"} for you.`
    : "I couldn't find a match yet. Try changing your budget or area.";
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
    const rooms = await Room.find(buildAssistantRoomQuery(filters))
      .populate("owner", "name slug isVerified")
      .sort({ priority: 1, createdAt: -1 })
      .limit(6);

    await ensurePublicSlugs(Room, rooms, (room) => room.title);
    const publicRooms = rooms.map((room) => sanitizeRoomListing(room));

    return res.status(200).json({
      reply: makeReply(message, publicRooms.length),
      filters,
      rooms: publicRooms,
    });
  } catch (error) {
    console.error("AI ROOM ASSISTANT REQUEST FAILED:", error.message);
    return res.status(500).json({
      success: false,
      message: "Room search abhi complete nahi ho paayi. Please dobara try karein.",
    });
  }
}

module.exports = { postAssistantMessage };
