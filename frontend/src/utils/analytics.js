const API_URL = (
  import.meta.env.VITE_API_URL
  || (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://roomslider-api.onrender.com/api")
).replace(/\/+$/, "");

const validSources = new Set(["google", "instagram", "whatsapp", "direct", "qr", "other"]);
let lastPageView = { path: "", time: 0 };

const makeId = () => window.crypto?.randomUUID?.()
  || `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

export function getAnalyticsSessionId() {
  try {
    let sessionId = window.localStorage.getItem("roomsliderAnalyticsSessionId");
    if (!sessionId) {
      sessionId = makeId();
      window.localStorage.setItem("roomsliderAnalyticsSessionId", sessionId);
    }
    return sessionId;
  } catch {
    return makeId();
  }
}

function detectDevice() {
  const agent = navigator.userAgent || "";
  if (/ipad|tablet|playbook|silk/i.test(agent)) return "tablet";
  if (/mobile|iphone|ipod|android/i.test(agent)) return "mobile";
  return "desktop";
}

function detectSource() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("src")?.toLowerCase() === "qr") return "qr";
  const campaign = `${params.get("utm_source") || ""} ${params.get("utm_medium") || ""}`.toLowerCase();
  if (campaign.includes("google")) return "google";
  if (campaign.includes("instagram")) return "instagram";
  if (campaign.includes("whatsapp")) return "whatsapp";
  try {
    const hostname = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : "";
    if (hostname.includes("google")) return "google";
    if (hostname.includes("instagram")) return "instagram";
    if (hostname.includes("whatsapp") || hostname.includes("wa.me")) return "whatsapp";
  } catch {
    return "direct";
  }
  return "direct";
}

export function track(type, event = {}) {
  try {
    if (!navigator || !window) return;
    if (type === "page_view") {
      const path = String(event.entityId || window.location.pathname);
      if (lastPageView.path === path && Date.now() - lastPageView.time < 1000) return;
      lastPageView = { path, time: Date.now() };
    }

    const payload = {
      type,
      entityType: event.entityType || "other",
      entityId: event.entityId == null ? "" : String(event.entityId),
      ...(event.ownerId ? { ownerId: String(event.ownerId) } : {}),
      sessionId: getAnalyticsSessionId(),
      device: detectDevice(),
      source: validSources.has(event.source) ? event.source : detectSource(),
      area: String(event.area || "").slice(0, 100),
      searchQuery: String(event.searchQuery || "").slice(0, 200),
    };
    if (Number.isFinite(Number(event.resultCount)) && event.resultCount != null) {
      payload.resultCount = Math.max(0, Math.floor(Number(event.resultCount)));
    }

    const body = JSON.stringify(payload);
    const url = `${API_URL}/analytics/track`;
    let token = "";
    try {
      token = window.localStorage.getItem("token") || "";
    } catch {
      token = "";
    }
    if (!token && typeof navigator.sendBeacon === "function") {
      try {
        if (navigator.sendBeacon(url, new Blob([body], { type: "text/plain;charset=UTF-8" }))) return;
      } catch {
        // Fetch fallback below handles beacon failures.
      }
    }
    if (typeof fetch === "function") {
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Tracking must never affect navigation or page actions.
  }
}
