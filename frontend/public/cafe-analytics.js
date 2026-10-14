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
  } catch (error) {
    visitorId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function track(type, adId) {
    var event = { type: type, cafe: cafe, location: location, visitorId: visitorId };
    if (adId) event.adId = adId;
    fetch("https://roomslider-api.onrender.com/api/ads/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
      credentials: "omit"
    }).catch(function () {});
  }

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
