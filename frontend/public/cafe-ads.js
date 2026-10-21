(function () {
  var body = document.body;
  var params = new URLSearchParams(window.location.search);
  var cafe = params.get("cafe") || body.dataset.cafe;
  var location = params.get("location") || body.dataset.location;
  if (!cafe || !location) return;
  var impressedAds = new Set();

  function getVisitorId() {
    try {
      var id = window.localStorage.getItem("roomsliderVisitorId");
      if (!id) {
        id = window.crypto && window.crypto.randomUUID
          ? window.crypto.randomUUID()
          : Date.now() + "-" + Math.random().toString(36).slice(2) + "-" + Math.random().toString(36).slice(2);
        window.localStorage.setItem("roomsliderVisitorId", id);
      }
      return id;
    } catch (error) {
      return Date.now() + "-" + Math.random().toString(36).slice(2);
    }
  }

  function trackImpression(adId) {
    var payload = JSON.stringify({
      type: "ad_impression",
      adId: String(adId),
      visitorId: getVisitorId(),
      source: "ad"
    });
    var endpoint = "https://roomslider-api.onrender.com/api/track";
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }))) return;
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true
      }).catch(function () {});
    } catch (error) {}
  }

  function validHttpsUrl(value) {
    try {
      return new URL(value).protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  function asList(value) {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }

  function makeSlide(ad, slot) {
    if (!ad) return null;
    var image = slot === "top" ? ad.logo : ad.image;
    if (!ad.text || !validHttpsUrl(ad.url) || !validHttpsUrl(image)) return null;

    var link = document.createElement("a");
    link.className = "ad-carousel-card ad-card";
    var separator = ad.url.indexOf("?") === -1 ? "?" : "&";
    link.href = ad.url + separator + "visitorId=" + encodeURIComponent(getVisitorId());
    link.target = "_blank";
    link.rel = "noopener sponsored";
    link.dataset.adId = ad.id || ad._id || "";
    link.dataset.adName = String(ad.text).slice(0, 120);
    link.hidden = true;

    var img = document.createElement("img");
    img.src = image;
    img.alt = "";
    if (slot === "bottom") img.loading = "lazy";
    link.appendChild(img);

    var copy = document.createElement("span");
    copy.className = "ad-carousel-copy";
    var label = document.createElement("small");
    label.textContent = "Sponsored";
    var text = document.createElement("strong");
    text.textContent = String(ad.text).slice(0, 160);
    copy.appendChild(label);
    copy.appendChild(text);
    link.appendChild(copy);

    var cta = document.createElement("span");
    cta.className = "ad-carousel-cta";
    cta.textContent = "Visit advertiser ↗";
    link.appendChild(cta);
    var adId = ad.id || ad._id;
    if (adId && window.IntersectionObserver) {
      var timer;
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !impressedAds.has(String(adId))) {
            timer = window.setTimeout(function () {
              if (impressedAds.has(String(adId))) return;
              impressedAds.add(String(adId));
              trackImpression(adId);
              observer.disconnect();
            }, 1000);
          } else if (timer) {
            window.clearTimeout(timer);
            timer = null;
          }
        });
      }, { threshold: [0.5] });
      observer.observe(link);
    }
    return link;
  }

  function renderCarousel(slot, ads) {
    var wrapper = document.getElementById(slot === "top" ? "adtop" : "adbot");
    if (!wrapper) return;
    var track = wrapper.querySelector(".ad-carousel-track");
    if (!track) return;

    var slides = ads.slice(0, 10).map(function (ad) { return makeSlide(ad, slot); }).filter(Boolean);
    if (!slides.length) return;
    slides.forEach(function (slide) { track.appendChild(slide); });
    wrapper.hidden = false;
    slides[0].hidden = false;
    if (slides.length === 1) return;

    var index = 0;
    var timer;
    var touchStart = null;
    function showSlide(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.hidden = slideIndex !== index;
      });
    }
    function scheduleNext() {
      window.clearTimeout(timer);
      if (wrapper.matches(":hover") || wrapper.contains(document.activeElement) || document.hidden) return;
      timer = window.setTimeout(function () {
        showSlide(index + 1);
        scheduleNext();
      }, 5000);
    }

    showSlide(0);
    wrapper.addEventListener("mouseenter", function () { window.clearTimeout(timer); });
    wrapper.addEventListener("mouseleave", scheduleNext);
    wrapper.addEventListener("focusin", function () { window.clearTimeout(timer); });
    wrapper.addEventListener("focusout", function () {
      window.setTimeout(scheduleNext, 0);
    });
    wrapper.addEventListener("touchstart", function (event) {
      touchStart = event.changedTouches[0].clientX;
      window.clearTimeout(timer);
    }, { passive: true });
    wrapper.addEventListener("touchend", function (event) {
      if (touchStart === null) return;
      var distance = event.changedTouches[0].clientX - touchStart;
      if (Math.abs(distance) > 40) showSlide(index + (distance < 0 ? 1 : -1));
      touchStart = null;
      scheduleNext();
    }, { passive: true });
    document.addEventListener("visibilitychange", scheduleNext);
    scheduleNext();
  }

  var messageLink = "https://wa.me/918889631476?text=" + encodeURIComponent(
    "I visited your menu from " + location + " and would like to connect with you about a QR menu."
  );
  document.querySelectorAll("[data-menu-whatsapp]").forEach(function (link) {
    link.href = messageLink;
  });

  var controller = window.AbortController ? new AbortController() : null;
  var timeout = window.setTimeout(function () {
    if (controller) controller.abort();
  }, 5000);
  fetch("https://roomslider-api.onrender.com/api/ads?cafe=" + encodeURIComponent(cafe) + "&location=" + encodeURIComponent(location), {
    signal: controller ? controller.signal : undefined,
    credentials: "omit",
    headers: { Accept: "application/json" }
  })
    .then(function (response) {
      if (!response.ok) throw new Error("Ad request failed");
      return response.json();
    })
    .then(function (data) {
      window.clearTimeout(timeout);
      renderCarousel("top", asList(data && data.top));
      renderCarousel("bottom", asList(data && data.bottom));
    })
    .catch(function () {
      window.clearTimeout(timeout);
    });
})();
