const Room = require("../models/room.model");
const { ensurePublicSlugs } = require("../utils/publicSlug");

const PUBLIC_ROOM_FIELDS = "title price location category slug status priority createdAt";
const PUBLIC_ROOM_CATEGORIES = ["Room", "PG", "Hostel", "Flat"];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPublicRoomFilter({ category, search, maxSearchLength = 50 } = {}) {
  const filter = { status: "vacant" };

  if (typeof category === "string" && category) {
    filter.category = category;
  }

  if (typeof search === "string") {
    const text = search.trim().slice(0, maxSearchLength);
    if (text) {
      const regex = new RegExp(escapeRegExp(text), "i");
      filter.$or = [{ title: regex }, { location: regex }, { category: regex }];
    }
  }

  return filter;
}

async function findPublicRoomListings({ category, search, page = 0, limit = 5 } = {}) {
  const safePage = Math.max(0, Number.parseInt(page, 10) || 0);
  const safeLimit = Math.min(6, Math.max(1, Number.parseInt(limit, 10) || 5));
  const rooms = await Room.find(buildPublicRoomFilter({ category, search }))
    .select(PUBLIC_ROOM_FIELDS)
    .sort({ priority: 1, createdAt: -1 })
    .skip(safePage * safeLimit)
    .limit(safeLimit)
    .lean();
  return ensurePublicSlugs(Room, rooms, (room) => room.title);
}

module.exports = {
  PUBLIC_ROOM_CATEGORIES,
  buildPublicRoomFilter,
  findPublicRoomListings,
};
