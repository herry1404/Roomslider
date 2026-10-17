(function (root) {
  "use strict";

  var FESTIVALS = [
    // verify with Drik Panchang (Indore)
    { id: "navratri", start: "2026-10-11", end: "2026-10-19", accent: "#C2185B", accent2: "#FFB300", greeting: "शुभ नवरात्रि 🙏 जय माता दी" },
    // verify with Drik Panchang (Indore)
    { id: "dussehra", start: "2026-10-20", end: "2026-10-21", accent: "#E65100", accent2: "#B71C1C", greeting: "विजयादशमी की हार्दिक शुभकामनाएँ 🏹" },
    // verify with Drik Panchang (Indore)
    { id: "diwali", start: "2026-11-05", end: "2026-11-11", accent: "#FFB300", darkAccent: "#0D1B3E", accent2: "#E65100", greeting: "शुभ दीपावली 🪔", dayGreetings: { "2026-11-06": "धनतेरस की हार्दिक शुभकामनाएँ", "2026-11-08": "शुभ दीपावली 🪔", "2026-11-10": "गोवर्धन पूजा की हार्दिक शुभकामनाएँ", "2026-11-11": "भाई दूज की हार्दिक शुभकामनाएँ" } },
    // verify with Drik Panchang (Indore)
    { id: "chhath", start: "2026-11-13", end: "2026-11-16", accent: "#F57C00", accent2: "#6D4C41", greeting: "छठ पूजा की हार्दिक शुभकामनाएँ ☀️" },
    // verify with Drik Panchang (Indore)
    { id: "makar-sankranti", start: "2027-01-13", end: "2027-01-15", accent: "#29B6F6", accent2: "#FDD835", greeting: "मकर संक्रांति की हार्दिक शुभकामनाएँ 🪁" },
    // verify with Drik Panchang (Indore)
    { id: "vasant-panchami", start: "2027-02-10", end: "2027-02-11", accent: "#F9A825", accent2: "#FFFFFF", greeting: "बसंत पंचमी की हार्दिक शुभकामनाएँ 🌼" },
    // verify with Drik Panchang (Indore)
    { id: "maha-shivratri", start: "2027-03-05", end: "2027-03-06", accent: "#3949AB", accent2: "#B0BEC5", greeting: "महाशिवरात्रि की हार्दिक शुभकामनाएँ 🔱 हर हर महादेव" },
    // verify with Drik Panchang (Indore)
    { id: "holi", start: "2027-03-20", end: "2027-03-22", accent: "#E91E63", accent2: "#00BCD4", greeting: "होली की हार्दिक शुभकामनाएँ 🎨", multicolor: true },
    // verify with Drik Panchang (Indore)
    { id: "chaitra-navratri", start: "2027-04-07", end: "2027-04-14", accent: "#D84315", accent2: "#FFB300", greeting: "चैत्र नवरात्रि की हार्दिक शुभकामनाएँ 🙏" },
    // verify with Drik Panchang (Indore)
    { id: "ram-navami", start: "2027-04-15", end: "2027-04-15", accent: "#EF6C00", accent2: "#FFB300", greeting: "राम नवमी की हार्दिक शुभकामनाएँ 🏹 जय श्री राम" },
    // verify with Drik Panchang (Indore)
    { id: "hanuman-jayanti", start: "2027-04-19", end: "2027-04-21", accent: "#E64A19", accent2: "#FF8F00", greeting: "हनुमान जयंती की हार्दिक शुभकामनाएँ 🚩 जय बजरंगबली" }
  ];

  function isIsoDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
    var parts = value.split("-").map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return date.getUTCFullYear() === parts[0]
      && date.getUTCMonth() === parts[1] - 1
      && date.getUTCDate() === parts[2];
  }

  function findFestival(date, forcedId) {
    if (forcedId === "off") return null;
    if (forcedId) return FESTIVALS.find(function (item) { return item.id === forcedId; }) || null;
    if (!isIsoDate(date)) return null;
    return FESTIVALS.find(function (item) { return date >= item.start && date <= item.end; }) || null;
  }

  function getGreeting(festival, date) {
    return festival && festival.dayGreetings && festival.dayGreetings[date]
      ? festival.dayGreetings[date]
      : festival && festival.greeting;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { FESTIVALS: FESTIVALS, findFestival: findFestival, getGreeting: getGreeting, isIsoDate: isIsoDate };
    return;
  }

  try {
    var script = document.currentScript;
    if (!script || (script.getAttribute("data-festival") || "").toLowerCase() === "off") return;

    var params = new URLSearchParams(root.location.search);
    var previewFestival = params.get("festival");
    var previewDate = params.get("festivalDate");
    var isPreview = params.has("festival") || params.has("festivalDate");
    var today;

    if (previewDate && isIsoDate(previewDate)) {
      today = previewDate;
    } else {
      var dateParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(new Date());
      var values = {};
      dateParts.forEach(function (part) {
        if (part.type !== "literal") values[part.type] = part.value;
      });
      today = values.year + "-" + values.month + "-" + values.day;
    }

    var cafeName = script.getAttribute("data-cafe-name") || "Cafe";
    if (document.body.dataset.cafe === "waffleo") cafeName = "Waffleo";
    var accentVars = (script.getAttribute("data-accent-vars") || "")
      .split(",")
      .map(function (name) { return name.trim(); })
      .filter(function (name) { return /^--[a-zA-Z][a-zA-Z0-9_-]*$/.test(name); });
    if (!accentVars.length) return;

    var style = document.createElement("style");
    style.textContent = [
      ".rs-festival-banner{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box;width:100%;max-height:44px;min-height:38px;padding:6px 42px 6px 12px;overflow:hidden;background:var(--rs-festival-bg);color:var(--rs-festival-text);font:650 12px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif;text-align:center}",
      ".rs-festival-banner:before{position:absolute;z-index:1;inset:0 0 auto;height:3px;content:'';background:linear-gradient(90deg,var(--rs-festival-accent),var(--rs-festival-accent2),var(--rs-festival-accent));background-size:200% 100%;pointer-events:none}",
      ".rs-festival-banner[data-multicolor='true']:before{background:linear-gradient(90deg,#E91E63,#FF9800,#FFEB3B,#4CAF50,#00BCD4,#3F51B5,#9C27B0)}",
      ".rs-festival-banner:after{position:absolute;z-index:-1;inset:3px 0 0;content:'';background:radial-gradient(ellipse at 50% 0%,rgba(255,255,255,.2),transparent 72%);pointer-events:none}",
      ".rs-festival-active .hero,.rs-festival-active body>header,.rs-festival-active .wrap>header{box-shadow:inset 0 -3px 0 var(--rs-festival-accent),inset 0 -5px 0 var(--rs-festival-accent2)}",
      ".rs-festival-greeting{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".rs-festival-from{flex:none;font-size:11px;font-weight:550;opacity:.82}",
      ".rs-festival-close{position:absolute;top:50%;right:8px;display:grid;width:28px;height:28px;place-items:center;transform:translateY(-50%);border:1px solid currentColor;border-radius:50%;background:transparent;color:inherit;font:700 19px/1 system-ui,sans-serif;cursor:pointer;opacity:.76}",
      ".rs-festival-close:focus-visible{outline:2px solid currentColor;outline-offset:1px}",
      "@media(prefers-reduced-motion:no-preference){.rs-festival-banner:before{animation:rs-festival-shimmer 8s linear infinite}.rs-festival-close:hover{opacity:1}@keyframes rs-festival-shimmer{to{background-position:200% 0}}}",
      "@media(prefers-reduced-motion:reduce){.rs-festival-banner,.rs-festival-banner:after{animation:none!important;transition:none!important}}"
    ].join("");
    document.head.appendChild(style);

    var banner;
    var activeFestival = null;
    var artLoading = false;

    function syncFestivalArt(currentFestival, date) {
      activeFestival = currentFestival;
      if (!currentFestival) {
        if (root.RoomSliderFestivalArt) root.RoomSliderFestivalArt.clear();
        return;
      }
      if (root.RoomSliderFestivalArt) {
        root.RoomSliderFestivalArt.render(currentFestival, date, banner);
        return;
      }
      if (artLoading) return;
      artLoading = true;
      var artScript = document.createElement("script");
      artScript.src = "/c/_shared/festival-art.js";
      artScript.async = true;
      artScript.onload = function () {
        artLoading = false;
        if (activeFestival && root.RoomSliderFestivalArt) {
          root.RoomSliderFestivalArt.render(activeFestival, getFestivalDate(), banner);
        }
      };
      artScript.onerror = function () {
        artLoading = false;
        if (root.console && root.console.warn) root.console.warn("Festival decoration could not be loaded.");
      };
      document.head.appendChild(artScript);
    }

    function parseColor(value) {
      var hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (hex) {
        var digits = hex[1].length === 3
          ? hex[1].split("").map(function (part) { return part + part; }).join("")
          : hex[1];
        return [0, 2, 4].map(function (index) { return parseInt(digits.slice(index, index + 2), 16); });
      }
      var match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      var parts = match[1].split(",").slice(0, 3).map(function (part) { return Number(part.trim()); });
      return parts.length === 3 && parts.every(Number.isFinite) ? parts : null;
    }

    function luminance(rgb) {
      var channels = rgb.map(function (part) {
        var value = part / 255;
        return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }

    function contrast(first, second) {
      var values = [luminance(first), luminance(second)].sort(function (a, b) { return b - a; });
      return (values[0] + 0.05) / (values[1] + 0.05);
    }

    function hexColor(rgb) {
      return "#" + rgb.map(function (part) {
        return Math.round(part).toString(16).padStart(2, "0");
      }).join("");
    }

    function safeAccent(color, backgrounds, darkMode) {
      var rgb = parseColor(color) || [0, 0, 0];
      var end = darkMode ? [255, 255, 255] : [0, 0, 0];
      for (var step = 0; step <= 100; step += 1) {
        var amount = step / 100;
        var candidate = rgb.map(function (part, index) { return part + (end[index] - part) * amount; });
        if (backgrounds.every(function (background) { return contrast(candidate, background) >= 4.5; })) {
          return hexColor(candidate);
        }
      }
      return darkMode ? "#FFFFFF" : "#000000";
    }

    function getFestivalDate() {
      if (isPreview && previewDate && isIsoDate(previewDate)) return previewDate;
      var parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(new Date());
      var date = {};
      parts.forEach(function (part) { if (part.type !== "literal") date[part.type] = part.value; });
      return date.year + "-" + date.month + "-" + date.day;
    }

    function addBanner(currentFestival, date) {
      var header = document.querySelector(".hero, body > header, .wrap > header");
      if (!header || !header.parentNode) return;
      var dismissedKey = "rs-festival-banner-dismissed-" + currentFestival.id;
      banner = document.createElement("div");
      banner.className = "rs-festival-banner";
      banner.setAttribute("role", "status");
      banner.setAttribute("aria-label", getGreeting(currentFestival, date) + " — " + cafeName + " ki taraf se");
      banner.dataset.multicolor = String(Boolean(currentFestival.multicolor));
      var greeting = document.createElement("span");
      greeting.className = "rs-festival-greeting";
      greeting.textContent = getGreeting(currentFestival, date);
      var from = document.createElement("span");
      from.className = "rs-festival-from";
      from.textContent = "— " + cafeName + " ki taraf se";
      var close = document.createElement("button");
      close.className = "rs-festival-close";
      close.type = "button";
      close.setAttribute("aria-label", "Festival greeting band karein");
      close.textContent = "×";
      close.addEventListener("click", function () {
        banner.remove();
        if (!isPreview) {
          try { sessionStorage.setItem(dismissedKey, "1"); } catch (error) {}
        }
      });
      banner.append(greeting, from, close);
      header.parentNode.insertBefore(banner, header.nextSibling);
    }

    function applyFestival() {
      var date = getFestivalDate();
      var currentFestival = findFestival(date, previewFestival);
      if (!currentFestival) {
        accentVars.forEach(function (name) { document.documentElement.style.removeProperty(name); });
        if (banner) banner.remove();
        banner = null;
        document.documentElement.classList.remove("rs-festival-active");
        syncFestivalArt(null, date);
        return;
      }

      var rootStyles = getComputedStyle(document.documentElement);
      var backgrounds = ["--bg", "--page", "--surface", "--card", "--chip", "--cream"]
        .map(function (name) { return parseColor(rootStyles.getPropertyValue(name).trim()); })
        .filter(Boolean);
      if (!backgrounds.length) backgrounds.push(parseColor(getComputedStyle(document.body).backgroundColor) || [255, 255, 255]);
      var primaryBackground = backgrounds[0];
      var darkMode = rootStyles.colorScheme === "dark" || luminance(primaryBackground) < 0.5;
      var primary = currentFestival.id === "diwali" && darkMode ? currentFestival.darkAccent : currentFestival.accent;
      var accessiblePrimary = safeAccent(primary, backgrounds, darkMode);
      var accessibleSecondary = safeAccent(currentFestival.accent2, backgrounds, darkMode);
      accentVars.forEach(function (name, index) {
        document.documentElement.style.setProperty(name, index % 2 === 0 ? accessiblePrimary : accessibleSecondary);
      });
      document.documentElement.style.setProperty("--rs-festival-accent", currentFestival.accent);
      document.documentElement.style.setProperty("--rs-festival-accent2", currentFestival.accent2);
      document.documentElement.style.setProperty("--rs-festival-bg", getComputedStyle(document.body).backgroundColor);
      document.documentElement.style.setProperty("--rs-festival-text", getComputedStyle(document.body).color);
      document.documentElement.classList.add("rs-festival-active");

      var alreadyDismissed = false;
      if (!isPreview) {
        try { alreadyDismissed = sessionStorage.getItem("rs-festival-banner-dismissed-" + currentFestival.id) === "1"; } catch (error) {}
      }
      if (banner) banner.remove();
      banner = null;
      if (!alreadyDismissed) addBanner(currentFestival, date);
      syncFestivalArt(currentFestival, date);
    }

    applyFestival();

    if (!isPreview) {
      function scheduleNextIstDay() {
        var now = new Date();
        var parts = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).formatToParts(now);
        var values = {};
        parts.forEach(function (part) { if (part.type !== "literal") values[part.type] = Number(part.value); });
        var nextMidnight = Date.UTC(values.year, values.month - 1, values.day + 1) - 330 * 60 * 1000;
        root.setTimeout(function () {
          applyFestival();
          scheduleNextIstDay();
        }, Math.max(1, nextMidnight - now.getTime() + 50));
      }
      scheduleNextIstDay();
    }

    if ("MutationObserver" in root) {
      new MutationObserver(applyFestival).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"]
      });
    }
    if (root.matchMedia) {
      root.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyFestival);
    }
  } catch (error) {
    if (root.console && root.console.error) root.console.error("Cafe festival theme skipped:", error);
  }
})(typeof window !== "undefined" ? window : globalThis);
