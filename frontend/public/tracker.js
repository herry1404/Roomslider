(function () {
  "use strict";

  var fallbackVisitorId;
  var fallbackSessionId;
  var apiBase = window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://roomslider-api.onrender.com/api";

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    var bytes = new Uint8Array(16);
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      window.crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes, function (byte) {
      return byte.toString(16).padStart(2, "0");
    }).join("");
  }

  function getStoredId(storage, key, fallbackKey) {
    try {
      var value = storage.getItem(key);
      if (!value) {
        value = createId();
        storage.setItem(key, value);
      }
      return value;
    } catch (error) {
      if (!window[fallbackKey]) window[fallbackKey] = createId();
      return window[fallbackKey];
    }
  }

  function getCafeSlug() {
    var bodyCafe = document.body && document.body.dataset.cafe;
    if (bodyCafe) return bodyCafe.toLowerCase();
    var match = window.location.pathname.match(/^\/c\/([^/]+)/i);
    return match ? decodeURIComponent(match[1]).toLowerCase() : "";
  }

  function getReferrerOrigin() {
    try {
      return document.referrer ? new URL(document.referrer).origin : "";
    } catch (error) {
      return "";
    }
  }

  function sendEvent(event) {
    var body = JSON.stringify(event);
    var url = apiBase + "/analytics/track";

    try {
      if (navigator.sendBeacon && navigator.sendBeacon(
        url,
        new Blob([body], { type: "text/plain;charset=UTF-8" })
      )) return;
    } catch (error) {
      // Fall back to fetch when the beacon API is unavailable or rejects the payload.
    }

    try {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: body,
        keepalive: true,
        credentials: "omit",
      }).catch(function () {});
    } catch (error) {
      // Analytics must not interfere with page rendering or navigation.
    }
  }

  var visitorId = getStoredId(window.localStorage, "roomslider-analytics-visitor", "roomsliderAnalyticsVisitorFallback");
  var sessionId = getStoredId(window.sessionStorage, "roomslider-analytics-session", "roomsliderAnalyticsSessionFallback");
  var page = window.location.pathname.slice(0, 200) || "/";
  var cafeSlug = getCafeSlug();
  var userAgent = navigator.userAgent || "";
  var device = /ipad|tablet|playbook|silk/i.test(userAgent)
    ? "tablet"
    : /mobile|iphone|ipod|android/i.test(userAgent) ? "mobile" : "desktop";
  var common = {
    visitorId: visitorId,
    sessionId: sessionId,
    page: page,
    device: device,
    referrer: getReferrerOrigin(),
  };

  function sendPageView() {
    var nextPage = window.location.pathname.slice(0, 200) || "/";
    if (nextPage === common.page) return;
    common.page = nextPage;
    sendEvent(Object.assign({ type: "page_view" }, common));
  }

  sendEvent(Object.assign({ type: "page_view" }, common));
  if (cafeSlug) {
    sendEvent(Object.assign({ type: "menu_view", cafeSlug: cafeSlug }, common));
  }

  // React Router changes history without reloading the document.
  ["pushState", "replaceState"].forEach(function (method) {
    var original = window.history[method];
    window.history[method] = function () {
      var result = original.apply(this, arguments);
      sendPageView();
      return result;
    };
  });
  window.addEventListener("popstate", sendPageView);

  document.addEventListener("click", function (event) {
    var target = event.target;
    var adElement = target instanceof Element
      ? target.closest("[data-ad-id][data-ad-name]")
      : null;
    if (!adElement) return;

    sendEvent(Object.assign({
      type: "ad_click",
      cafeSlug: cafeSlug || undefined,
      adId: adElement.dataset.adId,
      adName: adElement.dataset.adName,
    }, common));
  });
})();
