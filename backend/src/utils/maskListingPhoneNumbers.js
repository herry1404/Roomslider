const PHONE_PATTERN = /(?<!\d)(\+?91[\s.-]?)?([6-9]\d{2})[\s.-]?(\d{3})[\s.-]?(\d{4})(?!\d)/g;

const maskPhoneNumbers = (value) => {
  if (typeof value !== "string") return value;
  return value.replace(PHONE_PATTERN, (_match, country = "", first, _middle, last) => `${country}${first}•••${last.slice(-2)}`);
};

const sanitizeRoomListing = (room, { includeContact = false } = {}) => {
  const listing = room?.toObject ? room.toObject() : { ...room };
  ["title", "description", "location", "ownerName"].forEach((field) => {
    if (listing[field]) listing[field] = maskPhoneNumbers(listing[field]);
  });
  ["amenities", "nearby"].forEach((field) => {
    if (Array.isArray(listing[field])) listing[field] = listing[field].map(maskPhoneNumbers);
  });
  if (!includeContact) {
    delete listing.contact;
    delete listing.whatsapp;
  }
  return listing;
};

module.exports = { maskPhoneNumbers, sanitizeRoomListing };
