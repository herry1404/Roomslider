export const RECENTLY_VIEWED_KEY = "recentlyViewedListingIds";

export function readRecentlyViewedIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string").slice(0, 10) : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(id) {
  if (!id) return;
  try {
    const ids = readRecentlyViewedIds().filter((item) => item !== String(id));
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify([String(id), ...ids].slice(0, 10)));
  } catch (error) {
    console.warn("Recently viewed history could not be saved:", error.message);
  }
}
