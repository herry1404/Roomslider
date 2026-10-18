const API_URL = (
  import.meta.env.VITE_API_URL
  || (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://roomslider-api.onrender.com/api")
).replace(/\/+$/, "");

export function getVisitorId() {
  try {
    let id = window.localStorage.getItem("roomsliderVisitorId");
    if (!id) {
      id = globalThis.crypto?.randomUUID?.()
        || `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem("roomsliderVisitorId", id);
    }
    return id;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function track(type, payload = {}) {
  try {
    const body = JSON.stringify({ ...payload, type, visitorId: getVisitorId() });
    const url = `${API_URL}/track`;
    let token = "";
    try {
      token = window.localStorage.getItem("token") || "";
    } catch {
      token = "";
    }

    if (token && typeof navigator !== "undefined" && typeof fetch === "function") {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body,
        keepalive: true,
      }).catch(() => {});
      return;
    }

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const queued = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      if (queued) return;
    }
    if (typeof fetch === "function") {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Tracking must never interfere with page actions.
  }
}

export const sourceFromLocation = (location) => {
  const carriedSource = location?.state?.analyticsSource;
  if (["home", "search", "map", "profile", "ad"].includes(carriedSource)) return carriedSource;
  if (location?.pathname === "/map" || location?.pathname.startsWith("/map/")) return "map";
  if (location?.search?.includes("search=")) return "search";
  return "listing";
};
