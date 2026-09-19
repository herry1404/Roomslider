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

// Example: /hostels/om-swastika-girls-hostel-6a7a8e7ecdae90db84d04181
export const roomPath = (room) => {
  const base = categoryPathMap[room.category] || "rooms";
  const slug = slugify(room.title);
  return slug ? `/${base}/${slug}-${room._id}` : `/${base}/${room._id}`;
};

// Works for both new slug URLs and old plain-ID URLs
export const idFromParam = (param = "") => {
  const match = param.match(/[a-f0-9]{24}$/i);
  return match ? match[0] : param;
};
