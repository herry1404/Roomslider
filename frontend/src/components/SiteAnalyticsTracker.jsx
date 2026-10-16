import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axios";

const getVisitorId = () => {
  try {
    let visitorId = sessionStorage.getItem("roomslider-site-visitor");
    if (!visitorId) {
      visitorId = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem("roomslider-site-visitor", visitorId);
    }
    return visitorId;
  } catch {
    return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
};

const getPlatform = () => {
  const userAgent = navigator.userAgent || "";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/macintosh|mac os/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Other";
};

const getAttribution = () => {
  const params = new URLSearchParams(window.location.search);
  const campaign = [params.get("utm_source"), params.get("utm_campaign")].filter(Boolean).join(" / ");
  let referrer = "";
  try {
    if (document.referrer) referrer = new URL(document.referrer).hostname.slice(0, 100);
  } catch {
    referrer = "";
  }
  const source = campaign || (referrer && !referrer.includes("roomslider.in") ? referrer : "Direct");
  return { source: source.slice(0, 100), referrer };
};

function SiteAnalyticsTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (/^\/(?:admin|owner|mess\/(?:login|dashboard)|hourly-manager)(?:\/|$)/i.test(pathname)) return;
    if (/^\/(?:cafe\/|htlcafe(?:\/|$))/.test(pathname)) return;

    const visitorId = getVisitorId();
    const eventId = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    const attribution = getAttribution();
    const device = window.matchMedia("(max-width: 767px)").matches ? "Mobile" : "Desktop";
    api.post("/analytics/page-view", {
      visitorId,
      eventId,
      path: pathname.slice(0, 160),
      ...attribution,
      platform: getPlatform(),
      device,
    }).catch((error) => {
      console.error("Site analytics tracking failed:", error);
    });

    const startedAt = Date.now();
    let durationSent = false;
    const sendDuration = () => {
      if (durationSent) return;
      durationSent = true;
      const durationSeconds = Math.min(43200, Math.floor((Date.now() - startedAt) / 1000));
      const url = `${api.defaults.baseURL}/analytics/page-view-duration`;
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, durationSeconds }),
        keepalive: true,
      }).catch((error) => {
        console.error("Site analytics duration tracking failed:", error);
      });
    };

    window.addEventListener("pagehide", sendDuration);
    return () => {
      window.removeEventListener("pagehide", sendDuration);
      sendDuration();
    };
  }, [pathname]);

  return null;
}

export default SiteAnalyticsTracker;
