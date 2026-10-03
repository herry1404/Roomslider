const categoryPathMap = {
  Room: "rooms",
  PG: "pg",
  Hostel: "hostels",
  Flat: "flats",
};

export const slugify = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");

// Public listing URLs use the listing name; object IDs stay in API requests.
export const roomPath = (room) => {
  const base = categoryPathMap[room.category] || "rooms";
  return `/${base}/${room.slug || slugify(room.title) || "listing"}`;
};

// Works for both new slug URLs and old plain-ID URLs
export const idFromParam = (param = "") => {
  const match = param.match(/[a-f0-9]{24}$/i);
  return match ? match[0] : param;
};
