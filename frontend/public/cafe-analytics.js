(function () {
  var body = document.body;
  var params = new URLSearchParams(window.location.search);
  var pathCafe = window.location.pathname.replace(/\/+$/, "").split("/").pop();
  var cafe = params.get("cafe") || (pathCafe === "waffleo" ? "waffleo" : body.dataset.cafe);
  var location = params.get("location") || body.dataset.location;
  if (!cafe || !location) return;

  var visitorId;
  try {
    visitorId = sessionStorage.getItem("cafe-analytics-visitor");
    if (!visitorId) {
      visitorId = window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
      sessionStorage.setItem("cafe-analytics-visitor", visitorId);
    }
  } catch {
    visitorId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  var platform = "Other";
  if (/android/i.test(navigator.userAgent || "")) platform = "Android";
  else if (/iphone|ipad|ipod/i.test(navigator.userAgent || "")) platform = "iOS";
  else if (/windows/i.test(navigator.userAgent || "")) platform = "Windows";
  else if (/macintosh|mac os/i.test(navigator.userAgent || "")) platform = "macOS";
  else if (/linux/i.test(navigator.userAgent || "")) platform = "Linux";

  var referrer = "";
  try {
    if (document.referrer) referrer = new URL(document.referrer).hostname.slice(0, 100);
  } catch {
    referrer = "";
  }
  var querySource = [params.get("utm_source"), params.get("utm_campaign")].filter(Boolean).join(" / ");
  var source = (querySource || (referrer && referrer.indexOf("roomslider.in") === -1 ? referrer : "Direct")).slice(0, 100);

  function track(type, adId) {
    var event = { type: type, cafe: cafe, location: location, visitorId: visitorId, source: source, platform: platform };
    if (adId) event.adId = adId;
    var payload = new URLSearchParams(event);
    var endpoint = "https://roomslider-api.onrender.com/api/ads/analytics";
    if (navigator.sendBeacon && navigator.sendBeacon(endpoint, payload)) return;
    fetch(endpoint, {
      method: "POST",
      body: payload,
      keepalive: true,
      credentials: "omit"
    }).catch(function () {});
  }

  fetch("https://roomslider-api.onrender.com/api/analytics/page-view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitorId: visitorId,
      path: window.location.pathname.slice(0, 160),
      source: source,
      referrer: referrer,
      platform: platform,
      device: window.matchMedia("(max-width: 767px)").matches ? "Mobile" : "Desktop"
    }),
    keepalive: true,
    credentials: "omit"
  }).catch(function () {});

  track("menu_view");
  var impressionsSent = Object.create(null);

  var observedAds = new WeakSet();
  var adObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.25) return;
        adObserver.unobserve(entry.target);
        var adId = entry.target.dataset.adId;
        if (adId && !impressionsSent[adId]) {
          impressionsSent[adId] = true;
          track("ad_impression", adId);
        }
      });
    }, { threshold: 0.25 })
    : null;

  function observeAds(wrapper) {
    wrapper.querySelectorAll(".ad-card").forEach(function (anchor) {
      if (observedAds.has(anchor) || !anchor.dataset.adId) return;
      if (adObserver) {
        observedAds.add(anchor);
        adObserver.observe(anchor);
      } else if (!wrapper.hidden && !anchor.hidden) {
        observedAds.add(anchor);
        track("ad_impression", anchor.dataset.adId);
      }
    });
  }

  ["adtop", "adbot"].forEach(function (id) {
    var wrapper = document.getElementById(id);
    if (!wrapper) return;
    observeAds(wrapper);
    if ("MutationObserver" in window) {
      new MutationObserver(function () {
        observeAds(wrapper);
      }).observe(wrapper, { childList: true, subtree: true, attributes: !adObserver, attributeFilter: ["hidden"] });
    }
  });

  document.addEventListener("click", function (event) {
    var target = event.target;
    var anchor = target instanceof Element ? target.closest(".ad-card") : null;
    if (anchor && anchor.dataset.adId) track("ad_click", anchor.dataset.adId);
  });
})();
