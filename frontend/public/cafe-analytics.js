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
    fetch("https://roomslider-api.onrender.com/api/ads/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
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

  function observeAd(slot) {
    var wrapper = document.getElementById(slot === "top" ? "adtop" : "adbot");
    var anchor = document.getElementById(slot === "top" ? "adtopa" : "adbota");
    if (!wrapper || !anchor || wrapper.hidden || !anchor.dataset.adId) return;
    if (!("IntersectionObserver" in window)) {
      track("ad_impression", anchor.dataset.adId);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
          observer.disconnect();
          var adId = anchor.dataset.adId;
          if (!impressionsSent[adId]) {
            impressionsSent[adId] = true;
            track("ad_impression", adId);
          }
        }
      });
    }, { threshold: 0.25 });
    observer.observe(wrapper);
  }

  ["top", "bottom"].forEach(function (slot) {
    observeAd(slot);
    var wrapper = document.getElementById(slot === "top" ? "adtop" : "adbot");
    if (wrapper && "MutationObserver" in window) {
      new MutationObserver(function () {
        observeAd(slot);
      }).observe(wrapper, { attributes: true, attributeFilter: ["hidden"] });
    }
  });

  document.addEventListener("click", function (event) {
    var anchor = event.target.closest("#adtopa, #adbota");
    if (anchor && anchor.dataset.adId) track("ad_click", anchor.dataset.adId);
  });
})();
