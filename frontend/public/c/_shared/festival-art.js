(function (root) {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var registry = {};
  var overlay = null;
  var banner = null;
  var clickHandler = null;
  var header = null;
  var previousPosition = "";
  var positionWasSet = false;
  var styleAdded = false;
  var staticMode = false;
  var MAX_BURST_PARTICLES = 8;

  function svgMarkup(markup, className) {
    var svg = document.createElementNS(NS, "svg");
    var viewBoxes = {
      anaar: "-40 -40 80 80",
      rangoli: "-26 -26 52 52",
      kite: "-24 -25 48 72",
      petal: "-15 -32 30 34",
      trishul: "-30 -65 60 115",
      "moon-stars": "-35 -45 70 90",
      "color-spark": "-15 -15 30 30",
      "saffron-glow": "-15 -15 30 30",
      dandiya: "-35 -40 70 80",
      "rising-sun": "-50 -50 100 100",
      "chhath-diya": "45 55 50 55",
      gada: "-30 -65 60 115",
      flag: "-5 -30 45 60"
    };
    svg.setAttribute("viewBox", viewBoxes[className] || "0 0 1000 120");
    svg.setAttribute("preserveAspectRatio", viewBoxes[className] ? "xMidYMid meet" : "none");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = markup;
    return svg;
  }

  function art(container, markup, className) {
    var classes = className.split(/\s+/);
    container.appendChild(svgMarkup('<g class="' + className + '">' + markup + "</g>", classes[0]));
  }

  var diya = '<path d="M-24 0 Q0 35 24 0Z" fill="#d66b18" stroke="#7b3917" stroke-width="2"/>' +
    '<path d="M0 0 C-13-13 10-18 0-34 C18-20 13-9 0 0Z" class="flame" fill="#ffb300" stroke="#e65100" stroke-width="2"/>' +
    '<path d="M0-5 C-5-12 4-17 1-22 C10-13 8-7 0-5Z" fill="#fff2a1"/>';

  registry.diwali = function (container, helpers) {
    [55, 145, 855, 945, 225].forEach(function (x, index) {
      art(container, '<g transform="translate(' + x + ' 91) scale(' + (index === 4 ? ".75" : ".86") + ')">' + diya + "</g>", "diya-lit");
    });
    art(container, '<g transform="translate(145 27)"><circle r="2" class="twinkle-dot"/><path d="M-10 0H10M0-10V10M-7-7L7 7M7-7L-7 7" class="spark-lines"/></g>' +
      '<g transform="translate(850 28)"><circle r="2" class="twinkle-dot"/><path d="M-10 0H10M0-10V10M-7-7L7 7M7-7L-7 7" class="spark-lines"/></g>' +
      '<g transform="translate(210 47)"><circle r="2" class="twinkle-dot"/><path d="M-8 0H8M0-8V8" class="spark-lines"/></g>' +
      '<g transform="translate(790 47)"><circle r="2" class="twinkle-dot"/><path d="M-8 0H8M0-8V8" class="spark-lines"/></g>', "sparklers");
    var bursts = helpers.date === "2026-11-06" || helpers.date === "2026-11-08" ? [275, 725, 500, 385] : [275, 725];
    bursts.forEach(function (x, index) {
      art(container, '<path d="M0-16L0-35M11-11L25-25M16 0H36M11 11L25 25M0 16V36M-11 11L-25 25M-16 0H-36M-11-11L-25-25" class="firework-rays"/>' +
        '<circle r="4" class="firework-core"/><circle cx="0" cy="-35" r="2.5"/><circle cx="25" cy="-25" r="2"/><circle cx="36" r="2.5"/><circle cy="36" r="2"/><circle cx="-25" cy="25" r="2.5"/>',
        "anaar" + (helpers.staticMode ? " static" : ""));
      container.lastChild.style.left = (x / 10) + "%";
      container.lastChild.style.top = (index % 2 ? "27px" : "35px");
    });
    art(container, '<circle r="23" fill="none" stroke="#e65100" stroke-width="2"/><circle r="15" fill="none" stroke="#ffb300" stroke-width="2"/><path d="M0-23L6-6L23 0L6 6L0 23L-6 6L-23 0L-6-6Z" fill="none" stroke="#d66b18" stroke-width="2"/><circle r="4" fill="#ffb300"/>', "rangoli");
    container.lastChild.style.left = "calc(100% - 62px)";
    container.lastChild.style.top = "7px";
  };

  registry.holi = function (container) {
    art(container, '<path d="M20 56L78 42L86 51L28 67Z" fill="#29b6f6" stroke="#125d83" stroke-width="3"/><path d="M28 67L20 78L12 66L20 56Z" fill="#ff4081" stroke="#92204d" stroke-width="3"/><path d="M76 44L86 51L104 44L96 37Z" fill="#fdd835" stroke="#926d00" stroke-width="2"/><path d="M88 49Q135 40 186 55" class="color-stream"/><path d="M186 55Q218 65 244 47" class="color-stream second"/>', "pichkari");
    art(container, '<circle cx="198" cy="34" r="8" fill="#ec407a"/><circle cx="225" cy="65" r="6" fill="#ffee58"/><circle cx="178" cy="76" r="5" fill="#00bcd4"/><circle cx="245" cy="32" r="7" fill="#66bb6a"/><circle cx="760" cy="35" r="7" fill="#ff4081"/><circle cx="790" cy="70" r="6" fill="#00bcd4"/><circle cx="825" cy="45" r="8" fill="#fdd835"/>', "gulal-puffs");
    art(container, '<path d="M0-12V12M-10 0H10M-7-7L7 7M7-7L-7 7" class="spark-lines"/>', "color-spark");
    container.lastChild.style.left = "calc(100% - 58px)";
    container.lastChild.style.top = "23px";
  };

  registry.dussehra = function (container) {
    art(container, '<path d="M45 20Q5 58 45 96" fill="none" stroke="#a64b15" stroke-width="5"/><path d="M45 20L62 15M45 96L62 101" stroke="#a64b15" stroke-width="3"/><path d="M31 61H112" stroke="#d84315" stroke-width="4" class="flying-arrow"/><path d="M29 61L42 54V68Z" fill="#b71c1c" class="flying-arrow"/><path d="M112 61L98 53V69Z" fill="#ffb300" class="flying-arrow"/><path d="M112 61L98 53V69Z" fill="#ffb300" transform="translate(700 0)" class="flying-arrow"/>', "bow-arrow");
    art(container, '<path d="M0-11V11M-9 0H9M-6-6L6 6M6-6L-6 6" class="spark-lines"/>', "saffron-glow");
    container.lastChild.style.left = "calc(100% - 45px)";
    container.lastChild.style.top = "23px";
  };

  function navratriArt(container) {
    [50, 135, 865, 950].forEach(function (x) {
      art(container, '<g transform="translate(' + x + ' 96) scale(.72)">' + diya + "</g>", "diya-lit");
    });
    art(container, '<path d="M0-36L-9-7H-2L-10 20L8-11H1L8-36Z" fill="#d84315" stroke="#8b2c12" stroke-width="2"/><path d="M-28-2L28 13M-25 15L25-4" stroke="#8b2c12" stroke-width="7" stroke-linecap="round"/><path d="M-28-2L28 13M-25 15L25-4" stroke="#ffb300" stroke-width="3" stroke-linecap="round"/>', "dandiya");
    container.lastChild.style.left = "calc(100% - 94px)";
    container.lastChild.style.top = "20px";
  }

  registry.navratri = navratriArt;
  registry["chaitra-navratri"] = navratriArt;

  registry["makar-sankranti"] = function (container) {
    [[70, 38, "#e91e63"], [175, 76, "#29b6f6"], [825, 37, "#ff9800"], [930, 75, "#8e24aa"]].forEach(function (kite, index) {
      art(container, '<path d="M0-20L17 0L0 20L-17 0Z" fill="' + kite[2] + '" stroke="#553b51" stroke-width="2"/><path d="M0-20V20M-17 0H17M0 20Q7 30 1 42" fill="none" stroke="#fff3d0" stroke-width="2"/><path d="M0-20L0 20" stroke="#ffffff" stroke-width="1.5"/>', "kite");
      container.lastChild.style.left = (kite[0] / 10) + "%";
      container.lastChild.style.top = kite[1] + "px";
      container.lastChild.style.animationDelay = (index * -1.2) + "s";
    });
  };

  registry["vasant-panchami"] = function (container) {
    for (var i = 0; i < 10; i += 1) {
      art(container, '<path d="M0 0C-13-11-9-25 0-30C9-25 13-11 0 0Z" fill="' + (i % 2 ? "#ffca28" : "#f9a825") + '" stroke="#a36c00" stroke-width="1.5"/><path d="M0-2V-25" stroke="#fff3b0" stroke-width="1.5"/>', "petal");
      container.lastChild.style.left = ((i * 13 + 4) % 94) + "%";
      container.lastChild.style.top = (i % 3 * 5) + "px";
      container.lastChild.style.animationDelay = (i * -.7) + "s";
    }
  };

  registry["maha-shivratri"] = function (container) {
    art(container, '<path d="M0 45V-42M0-25L-23-2M0-25L23-2M-23-2V10M23-2V10M-23 10Q0 26 23 10M-10-8H10" fill="none" stroke="#536dfe" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M-12-7Q0-20 12-7L8 3H-8Z" fill="#b0bec5" stroke="#455a64" stroke-width="2"/><path d="M-12-7L-20-16M12-7L20-16" stroke="#3949ab" stroke-width="4"/>', "trishul");
    art(container, '<path d="M0-25C-25-14-25 14 0 25C-12 7-12-7 0-25Z" fill="#ffecb3" stroke="#aa8d58" stroke-width="2"/><path d="M-30 0H-22M25-12L30-17M23 15L30 20M-4-35V-41" class="star-points"/>', "moon-stars");
    container.lastChild.style.left = "calc(100% - 95px)";
    container.lastChild.style.top = "34px";
  };

  registry.chhath = function (container) {
    art(container, '<circle cx="0" cy="0" r="29" fill="#ffb300" stroke="#e65100" stroke-width="3"/><path d="M-43 0H43M-31-25L-22-17M31-25L22-17M0-43V-34" stroke="#f57c00" stroke-width="4" stroke-linecap="round"/><path d="M-35 19Q0 10 35 19M-30 27Q0 19 30 27M-22 35Q0 29 22 35" fill="none" stroke="#29b6f6" stroke-width="3" class="water-wave"/>', "rising-sun");
    container.lastChild.style.left = "calc(100% - 76px)";
    container.lastChild.style.top = "31px";
    art(container, '<g transform="translate(70 93) scale(.68)">' + diya + "</g>", "chhath-diya");
  };

  registry["ram-navami"] = function (container) {
    art(container, '<path d="M40 20Q0 58 40 96M40 20L56 15M40 96L56 101" fill="none" stroke="#e65100" stroke-width="5"/><path d="M30 60H100" stroke="#ef6c00" stroke-width="3"/><path d="M100 60L87 53V67Z" fill="#ffb300"/><g transform="translate(770 0)"><path d="M0 5L22 17L0 29ZM48 3L70 15L48 27ZM96 5L118 17L96 29Z" fill="#ef6c00" stroke="#9b3c08" stroke-width="2"/></g>', "ram-bow-flags");
  };

  registry["hanuman-jayanti"] = function (container) {
    art(container, '<path d="M0-39V37M-18-35Q0-54 18-35L15-5Q0 2-15-5Z" fill="#ef8f22" stroke="#7b3f12" stroke-width="4"/><path d="M-12-22H12M-12-11H12" stroke="#fff3c4" stroke-width="3"/><path d="M-13 37H13M-23 45H23" stroke="#7b3f12" stroke-width="5" stroke-linecap="round"/><path d="M0-51V-61" stroke="#e64a19" stroke-width="4"/>', "gada");
    art(container, '<path d="M0 0L34-24V24Z" fill="#f57c00" stroke="#8b3215" stroke-width="2"/><path d="M2 0L30-19" stroke="#ffcf58" stroke-width="3"/><path d="M0-4V5" stroke="#8b3215" stroke-width="3"/>', "flag");
    container.lastChild.style.left = "calc(100% - 57px)";
    container.lastChild.style.top = "38px";
  };

  function ensureStyle() {
    if (styleAdded) return;
    var style = document.createElement("style");
    style.textContent = [
      ".rs-festival-art{position:absolute;inset:0 0 auto;height:min(120px,100%);overflow:hidden;pointer-events:none;z-index:0}",
      ".rs-festival-art svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;opacity:.76}",
      ".rs-festival-art .flame{transform-box:fill-box;transform-origin:50% 100%}",
      ".rs-festival-art .anaar{position:absolute;width:58px;height:58px;transform:translate(-50%,-50%);overflow:visible}",
      ".rs-festival-art .rangoli{position:absolute;width:54px;height:54px;transform:translate(-50%,-50%)}",
      ".rs-festival-art .pichkari{position:absolute;left:0;top:0;width:250px;height:120px}",
      ".rs-festival-art .color-spark,.rs-festival-art .saffron-glow,.rs-festival-art .moon-stars{position:absolute;width:48px;height:48px;transform:translate(-50%,-50%)}",
      ".rs-festival-art .dandiya{position:absolute;left:calc(100% - 76px);top:28px;width:60px;height:60px;transform:translate(-50%,-50%)}",
      ".rs-festival-art .rising-sun{position:absolute;left:calc(100% - 70px);top:31px;width:74px;height:74px;transform:translate(-50%,-50%)}",
      ".rs-festival-art .trishul{position:absolute;left:52px;top:60px;width:60px;height:95px;transform:translate(-50%,-50%)}",
      ".rs-festival-art .moon-stars{left:calc(100% - 58px);top:45px}",
      ".rs-festival-art .chhath-diya{position:absolute;left:4px;top:0;width:55px;height:50px}",
      ".rs-festival-art .ram-bow-flags{position:absolute;inset:0;width:100%;height:100%}",
      ".rs-festival-art .gada{position:absolute;left:54px;top:60px;width:65px;height:100px;transform:translate(-50%,-50%)}",
      ".rs-festival-art .flag{position:absolute;left:calc(100% - 40px);top:57px;width:50px;height:50px;transform:translate(-50%,-50%)}",
      ".rs-festival-art .spark-lines{fill:none;stroke:#ffca28;stroke-width:2;stroke-linecap:round}",
      ".rs-festival-art .firework-rays{fill:none;stroke:#ff8f00;stroke-width:2;stroke-linecap:round}",
      ".rs-festival-art .firework-core{fill:#fff3a0}",
      ".rs-festival-art .twinkle-dot{fill:#fff3a0}",
      ".rs-festival-art .color-stream{fill:none;stroke:#ec407a;stroke-width:7;stroke-linecap:round;stroke-dasharray:9 7}",
      ".rs-festival-art .color-stream.second{stroke:#00bcd4;stroke-width:4;stroke-dasharray:5 8}",
      ".rs-festival-art .flying-arrow{transform-box:fill-box;transform-origin:left center}",
      ".rs-festival-art .star-points{fill:none;stroke:#ffe082;stroke-width:2;stroke-linecap:round}",
      ".rs-festival-art .petal{position:absolute;width:17px;height:32px;transform:translate(-50%,-50%)}",
      ".rs-festival-art .kite{position:absolute;width:44px;height:68px;transform:translate(-50%,-50%)}",
      ".rs-festival-art .bow-arrow{position:absolute;inset:0;width:100%;height:100%}",
      ".rs-festival-art .diya-lit{position:absolute;inset:0;width:100%;height:100%}",
      ".rs-festival-art .sparklers,.rs-festival-art .gulal-puffs,.rs-festival-art .pichkari,.rs-festival-art .ram-bow-flags,.rs-festival-art .bow-arrow,.rs-festival-art .diya-lit{position:absolute;inset:0;width:100%;height:100%}",
      ".rs-festival-art .color-spark,.rs-festival-art .saffron-glow{position:absolute;width:48px;height:48px;transform:translate(-50%,-50%)}",
      ".rs-festival-art.rs-art-paused *{animation-play-state:paused!important}",
      ".rs-festival-art.rs-art-static *{animation:none!important}",
      ".rs-festival-art-burst{position:fixed;z-index:2;width:62px;height:62px;overflow:visible;pointer-events:none;transform:translate(-50%,-50%)}",
      ".rs-festival-art-burst circle{transform-box:fill-box;transform-origin:center;animation:rs-art-pop .85s ease-out both}",
      ".rs-festival-art-paused .rs-festival-art-burst circle{animation-play-state:paused!important}",
      "@keyframes rs-art-flicker{0%,100%{transform:scale(.9,1);opacity:.84}50%{transform:scale(1.08,.86);opacity:1}}",
      "@keyframes rs-art-twinkle{0%,100%{opacity:.3;transform:scale(.65)}50%{opacity:1;transform:scale(1.15)}}",
      "@keyframes rs-art-burst{0%{opacity:0;transform:scale(.25)}22%{opacity:1}100%{opacity:0;transform:scale(1.12)}}",
      "@keyframes rs-art-stream{to{stroke-dashoffset:-32}}",
      "@keyframes rs-art-arrow{0%,68%{transform:translateX(0);opacity:0}72%{opacity:1}100%{transform:translateX(720px);opacity:0}}",
      "@keyframes rs-art-float{0%,100%{transform:translate(-50%,-50%) rotate(-4deg)}50%{transform:translate(-50%,calc(-50% - 8px)) rotate(5deg)}}",
      "@keyframes rs-art-fall{0%{transform:translate(-50%,-25px) rotate(0);opacity:0}12%{opacity:.82}100%{transform:translate(calc(-50% + 25px),145px) rotate(260deg);opacity:0}}",
      "@keyframes rs-art-wave{50%{transform:translateX(8px);opacity:.58}}",
      "@keyframes rs-art-pop{0%{opacity:0;transform:scale(.2)}20%{opacity:1}100%{opacity:0;transform:scale(1.7)}}",
      ".rs-festival-art:not(.rs-art-static) .flame{animation:rs-art-flicker .8s ease-in-out infinite}",
      ".rs-festival-art:not(.rs-art-static) .twinkle-dot,.rs-festival-art:not(.rs-art-static) .star-points{animation:rs-art-twinkle 1.8s ease-in-out infinite alternate}",
      ".rs-festival-art:not(.rs-art-static) .anaar{animation:rs-art-burst 2.4s ease-out infinite;animation-delay:1.3s}",
      ".rs-festival-art:not(.rs-art-static) .color-stream{animation:rs-art-stream .9s linear infinite}",
      ".rs-festival-art:not(.rs-art-static) .gulal-puffs circle{animation:rs-art-float 2.4s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}",
      ".rs-festival-art:not(.rs-art-static) .flying-arrow{animation:rs-art-arrow 5s ease-in-out infinite;animation-delay:2s}",
      ".rs-festival-art:not(.rs-art-static) .kite{animation:rs-art-float 4s ease-in-out infinite}",
      ".rs-festival-art:not(.rs-art-static) .petal{animation:rs-art-fall 5s linear infinite}",
      ".rs-festival-art:not(.rs-art-static) .water-wave{animation:rs-art-wave 2.4s ease-in-out infinite alternate}",
      "@media(prefers-reduced-motion:reduce){.rs-festival-art *,.rs-festival-art-burst *{animation:none!important}}"
    ].join("");
    document.head.appendChild(style);
    styleAdded = true;
  }

  function remove() {
    if (banner && clickHandler) banner.removeEventListener("click", clickHandler);
    if (overlay) overlay.remove();
    if (header && positionWasSet) header.style.position = previousPosition;
    overlay = null;
    banner = null;
    clickHandler = null;
    header = null;
    positionWasSet = false;
    staticMode = false;
  }

  function addTapBurst(event, festivalId) {
    if (!overlay || staticMode || !event || event.target.closest(".rs-festival-close")) return;
    var oldBurst = document.querySelector(".rs-festival-art-burst");
    if (oldBurst) oldBurst.remove();
    var burst = document.createElementNS(NS, "svg");
    burst.setAttribute("viewBox", "0 0 100 100");
    burst.setAttribute("class", "rs-festival-art-burst");
    burst.setAttribute("aria-hidden", "true");
    burst.style.left = event.clientX + "px";
    burst.style.top = event.clientY + "px";
    var colors = festivalId === "diwali" ? ["#ffb300", "#ff7043", "#fff176", "#ffffff"]
      : festivalId === "holi" ? ["#ec407a", "#fdd835", "#00bcd4", "#66bb6a"]
        : ["#ffb300", "#ffffff", "#ff7043"];
    for (var i = 0; i < MAX_BURST_PARTICLES; i += 1) {
      var angle = Math.PI * 2 * i / MAX_BURST_PARTICLES;
      var circle = document.createElementNS(NS, "circle");
      circle.setAttribute("cx", String(50 + Math.cos(angle) * 25));
      circle.setAttribute("cy", String(50 + Math.sin(angle) * 25));
      circle.setAttribute("r", i % 2 ? "3" : "4");
      circle.setAttribute("fill", colors[i % colors.length]);
      circle.style.animationDelay = (i * 0.025) + "s";
      burst.appendChild(circle);
    }
    document.body.appendChild(burst);
    root.setTimeout(function () { burst.remove(); }, 1100);
  }

  function render(festival, date, greetingBanner) {
    try {
      remove();
      if (!festival || !registry[festival.id]) return;
      var target = greetingBanner && greetingBanner.previousElementSibling;
      if (!target) target = document.querySelector(".hero, body > header, .wrap > header");
      if (!target) return;

      ensureStyle();
      header = target;
      previousPosition = header.style.position;
      positionWasSet = root.getComputedStyle(header).position === "static";
      if (positionWasSet) header.style.position = "relative";

      overlay = document.createElement("div");
      overlay.className = "rs-festival-art";
      overlay.setAttribute("aria-hidden", "true");
      var hardware = root.navigator || {};
      var media = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var lowPower = (hardware.hardwareConcurrency && hardware.hardwareConcurrency <= 2)
        || (hardware.deviceMemory && hardware.deviceMemory <= 2);
      if (media || lowPower) overlay.classList.add("rs-art-static");
      staticMode = Boolean(media || lowPower);
      if (document.hidden) overlay.classList.add("rs-art-paused");
      header.appendChild(overlay);

      registry[festival.id](overlay, { date: date, greeting: festival.greeting, staticMode: Boolean(media || lowPower) });
      if (greetingBanner) {
        banner = greetingBanner;
        clickHandler = function (event) { addTapBurst(event, festival.id); };
        banner.addEventListener("click", clickHandler);
      }
    } catch (error) {
      remove();
      if (root.console && root.console.warn) root.console.warn("Festival decoration skipped:", error);
    }
  }

  try {
    if (typeof module !== "undefined" && module.exports) {
      module.exports = { registry: registry };
      return;
    }
    root.RoomSliderFestivalArt = { render: render, clear: remove };
    document.addEventListener("visibilitychange", function () {
      if (overlay) overlay.classList.toggle("rs-art-paused", document.hidden);
      document.documentElement.classList.toggle("rs-festival-art-paused", document.hidden);
    });
  } catch (error) {
    if (root.console && root.console.warn) root.console.warn("Festival art unavailable:", error);
  }
})(typeof window !== "undefined" ? window : globalThis);
