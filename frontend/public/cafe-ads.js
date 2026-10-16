(function () {
  var body = document.body;
  var params = new URLSearchParams(window.location.search);
  var cafe = params.get("cafe") || body.dataset.cafe;
  var location = params.get("location") || body.dataset.location;
  if (!cafe || !location) return;

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
    link.href = ad.url;
    link.target = "_blank";
    link.rel = "noopener sponsored";
    link.dataset.adId = ad.id || ad._id || "";
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
    return link;
  }

  function renderCarousel(slot, ads) {
    var wrapper = document.getElementById(slot === "top" ? "adtop" : "adbot");
    if (!wrapper) return;
    var track = wrapper.querySelector(".ad-carousel-track");
    var controls = wrapper.querySelector(".ad-carousel-controls");
    var count = wrapper.querySelector("[data-ad-count]");
    var previous = wrapper.querySelector("[data-ad-previous]");
    var next = wrapper.querySelector("[data-ad-next]");
    if (!track || !controls || !count || !previous || !next) return;

    var slides = ads.slice(0, 10).map(function (ad) { return makeSlide(ad, slot); }).filter(Boolean);
    if (!slides.length) return;
    slides.forEach(function (slide) { track.appendChild(slide); });
    wrapper.hidden = false;
    slides[0].hidden = false;
    if (slides.length === 1) return;

    controls.hidden = false;
    var index = 0;
    var timer;
    var touchStart = null;
    function showSlide(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.hidden = slideIndex !== index;
      });
      count.textContent = (index + 1) + " / " + slides.length;
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
    previous.addEventListener("click", function () {
      showSlide(index - 1);
      scheduleNext();
    });
    next.addEventListener("click", function () {
      showSlide(index + 1);
      scheduleNext();
    });
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
