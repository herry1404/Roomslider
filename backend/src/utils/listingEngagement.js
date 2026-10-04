const crypto = require("crypto");
const ListingEngagement = require("../models/ListingEngagement");
const Room = require("../models/room.model");

function getVisitorKey(req) {
  if (req.user?._id) {
    return `${req.user.role || "user"}:${req.user._id}`;
  }

  const fingerprint = `${req.ip || ""}|${req.get("user-agent") || ""}`;
  return `anonymous:${crypto.createHash("sha256").update(fingerprint).digest("hex")}`;
}

async function recordListingEngagement(roomId, req, type) {
  const now = new Date();
  const result = await ListingEngagement.updateOne(
    {
      room: roomId,
      visitorKey: getVisitorKey(req),
      day: now.toISOString().slice(0, 10),
      type,
    },
    {
      $setOnInsert: {
        room: roomId,
        visitorKey: getVisitorKey(req),
        day: now.toISOString().slice(0, 10),
        type,
      },
    },
    { upsert: true }
  );

  const created = result.upsertedCount > 0;
  if (created && type === "view") {
    await Room.updateOne({ _id: roomId }, { $inc: { views: 1 } });
  }
  return created;
}

module.exports = { recordListingEngagement };
