const SavedSearch = require("../models/SavedSearch");
const { notifyUser } = require("./notificationDelivery");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const listingLink = (room) => {
  const path = { Room: "rooms", PG: "pg", Hostel: "hostels", Flat: "flats" }[room.category] || "rooms";
  return `/${path}/${room.slug || room._id}`;
};

async function notifySavedSearchMatches(rooms) {
  const available = rooms.filter((room) => room?.status === "vacant" && room.location);
  if (!available.length) return;

  const filters = available.map((room) => ({
    category: { $in: ["Any", room.category] },
    gender: {
      $in: room.gender === "Any" ? ["Any", "Male", "Female"] : ["Any", room.gender],
    },
    $or: [{ maxPrice: 0 }, { maxPrice: { $gte: Number(room.price) || 0 } }],
  }));

  try {
    const searches = await SavedSearch.find({ $or: filters }).select("user area category maxPrice gender").lean();
    const matchByUser = new Map();
    for (const search of searches) {
      const areaMatcher = new RegExp(escapeRegex(search.area), "i");
      const room = available.find((item) =>
        areaMatcher.test(item.location)
        && (search.category === "Any" || search.category === item.category)
        && (search.gender === "Any" || item.gender === "Any" || search.gender === item.gender)
        && (!search.maxPrice || Number(item.price) <= search.maxPrice)
      );
      if (room && !matchByUser.has(String(search.user))) {
        matchByUser.set(String(search.user), room);
      }
    }

    const notifications = [...matchByUser.entries()].map(([userId, room]) => ({
      userId,
      room,
    }));
    for (let start = 0; start < notifications.length; start += 25) {
      await Promise.all(notifications.slice(start, start + 25).map(({ userId, room }) =>
        notifyUser(userId, {
          type: "saved_search",
          title: "A new listing matches your search",
          body: `${room.title} in ${room.location} is available for ₹${Number(room.price).toLocaleString("en-IN")} per month.`,
          link: listingLink(room),
          image: room.images?.[0] || "",
          data: { roomId: String(room._id) },
        })
      ));
    }
  } catch (error) {
    console.error("SAVED SEARCH ALERT ERROR:", error.message);
  }
}

module.exports = { notifySavedSearchMatches };
