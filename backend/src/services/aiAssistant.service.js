const { z } = require("zod");
const { buildPublicRoomFilter } = require("./publicRoomListings.service");

const assistantFiltersSchema = z.object({
  category: z.enum(["Room", "PG", "Hostel", "Flat"]).nullable(),
  gender: z.enum(["Male", "Female", "Any"]).nullable(),
  minPrice: z.number().nonnegative().nullable(),
  maxPrice: z.number().nonnegative().nullable(),
  area: z.string().trim().min(1).max(100).nullable(),
  college: z.string().trim().min(1).max(100).nullable(),
  sharingType: z.enum(["Single", "Double", "Triple", "Other"]).nullable(),
  keywords: z.string().trim().min(1).max(100).nullable(),
}).strict();

const SYSTEM_PROMPT = `You are RoomSlider's room-search filter extractor. Return ONLY valid JSON with exactly these keys: {"category":null,"gender":null,"minPrice":null,"maxPrice":null,"area":null,"college":null,"sharingType":null,"keywords":null}.
Use category Room, PG, Hostel, or Flat; gender Male, Female, or Any; sharingType Single, Double, Triple, or Other. minPrice and maxPrice must be numbers in rupees. Use a concise area, college, or keyword string only when the user provided one. Unknown values must be null. Never invent rooms or claim that a room exists; only extract search filters from the user's message.`;

function parseAssistantFilters(content) {
  const json = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return assistantFiltersSchema.parse(JSON.parse(json));
}

function sanitizeSearchMessage(message) {
  return message
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, " ")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

function fallbackFilters(message) {
  const keywords = message
    .toLowerCase()
    .replace(/\b(?:i|am|a|an|the|for|with|in|near|nearby|under|below|less|than|around|please|want|need|looking|find|me|room|chahiye|mujhe|ke|liye|hai|karo)\b/gi, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);

  return {
    category: null,
    gender: null,
    minPrice: null,
    maxPrice: null,
    area: null,
    college: null,
    sharingType: null,
    keywords: keywords || message.trim().slice(0, 100),
  };
}

async function extractAssistantFilters(message, {
  env = process.env,
  fetchImpl = global.fetch,
  logger = console,
} = {}) {
  if (!env.GEMINI_API_KEY) {
    const error = new Error("AI Room Finder is not configured");
    error.code = "GEMINI_API_KEY_MISSING";
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const model = env.GEMINI_MODEL || "gemini-2.5-flash";
    const response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: sanitizeSearchMessage(message) }] }],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 300,
          },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const content = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("\n");
    if (!content) throw new Error("Gemini returned no filter content");
    return parseAssistantFilters(content);
  } catch (error) {
    logger.warn("AI ROOM FILTER EXTRACTION FAILED:", error.message);
    return fallbackFilters(message);
  } finally {
    clearTimeout(timeout);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textCondition(value, fields) {
  const regex = new RegExp(escapeRegExp(value.trim().slice(0, 100)), "i");
  return { $or: fields.map((field) => ({ [field]: regex })) };
}

function buildAssistantRoomQuery(filters = {}) {
  const query = buildPublicRoomFilter({ category: filters.category });
  const conditions = [];

  if (filters.gender && filters.gender !== "Any") {
    query.gender = { $in: [filters.gender, "Any"] };
  }

  const price = {};
  if (Number.isFinite(filters.minPrice)) price.$gte = filters.minPrice;
  if (Number.isFinite(filters.maxPrice)) price.$lte = filters.maxPrice;
  if (Object.keys(price).length) query.price = price;

  if (filters.sharingType) query.sharingType = filters.sharingType;
  if (filters.area) conditions.push(textCondition(filters.area, ["location"]));
  if (filters.college) {
    conditions.push(textCondition(filters.college, ["title", "location", "description", "nearby"]));
  }
  if (filters.keywords) {
    const keywords = filters.keywords
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 8);
    if (keywords.length) {
      conditions.push({
        $or: keywords.flatMap((keyword) => {
          const regex = new RegExp(escapeRegExp(keyword), "i");
          return ["title", "location", "category", "description", "nearby"]
            .map((field) => ({ [field]: regex }));
        }),
      });
    }
  }
  if (conditions.length) query.$and = conditions;

  return query;
}

module.exports = {
  assistantFiltersSchema,
  buildAssistantRoomQuery,
  extractAssistantFilters,
  fallbackFilters,
  parseAssistantFilters,
  sanitizeSearchMessage,
};
