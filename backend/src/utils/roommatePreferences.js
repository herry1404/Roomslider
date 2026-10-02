const SEEKING = ["room", "roommate", "both"];
const SHARING = ["", "Single", "Double", "Triple", "Other"];
const LIFESTYLE = {
  cleanliness: ["", "relaxed", "moderate", "very"],
  sleepSchedule: ["", "early", "flexible", "late"],
  smoking: ["", "no", "sometimes", "yes"],
  guests: ["", "rarely", "sometimes", "often"],
};

const cleanText = (value, max) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const sanitizeRoommatePreferences = (input = {}) => {
  const updates = {};
  if (input.active !== undefined) {
    if (typeof input.active !== "boolean") return { error: "Invalid profile visibility setting" };
    updates["roommatePreferences.active"] = input.active;
  }
  if (input.seeking !== undefined) {
    if (!SEEKING.includes(input.seeking)) return { error: "Invalid roommate search type" };
    updates["roommatePreferences.seeking"] = input.seeking;
  }
  if (input.sharingType !== undefined) {
    if (!SHARING.includes(input.sharingType)) return { error: "Invalid sharing type" };
    updates["roommatePreferences.sharingType"] = input.sharingType;
  }
  for (const key of ["budgetMin", "budgetMax"]) {
    if (input[key] === undefined) continue;
    const value = Number(input[key]);
    if (!Number.isFinite(value) || value < 0) {
      return { error: "Enter a valid monthly budget range" };
    }
    updates[`roommatePreferences.${key}`] = value;
  }
  if (
    input.budgetMin !== undefined &&
    input.budgetMax !== undefined &&
    Number(input.budgetMax) > 0 &&
    Number(input.budgetMin) > Number(input.budgetMax)
  ) {
    return { error: "Enter a valid monthly budget range" };
  }
  if (input.moveInDate !== undefined) {
    const moveInDate = input.moveInDate ? new Date(input.moveInDate) : null;
    if (moveInDate && Number.isNaN(moveInDate.getTime())) {
      return { error: "Invalid move-in date" };
    }
    updates["roommatePreferences.moveInDate"] = moveInDate;
  }
  if (input.lifestyle !== undefined) {
    if (!input.lifestyle || typeof input.lifestyle !== "object" || Array.isArray(input.lifestyle)) {
      return { error: "Invalid lifestyle preferences" };
    }
    for (const [key, options] of Object.entries(LIFESTYLE)) {
      if (input.lifestyle[key] === undefined) continue;
      if (!options.includes(input.lifestyle[key])) {
        return { error: `Invalid ${key} preference` };
      }
      updates[`roommatePreferences.lifestyle.${key}`] = input.lifestyle[key];
    }
  }
  if (input.bio !== undefined) updates.bio = cleanText(input.bio, 150);
  if (input.city !== undefined) updates.city = cleanText(input.city, 60);
  if (input.area !== undefined) updates.area = cleanText(input.area, 60);
  return { updates };
};

module.exports = { sanitizeRoommatePreferences };
