(function () {
  "use strict";

  var script = document.currentScript;
  var cafeSlug = script && script.getAttribute("data-cafe");
  if (!cafeSlug || !/^[a-z0-9-]+$/.test(cafeSlug)) return;

  var button = document.createElement("a");
  button.href = "/rewards/" + encodeURIComponent(cafeSlug);
  button.target = "_top";
  button.rel = "noopener";
  button.textContent = "Daily Reward";
  button.setAttribute("aria-label", "Open daily cafe rewards");
  button.style.cssText = [
    "position:fixed",
    "z-index:2147483000",
    "right:max(14px,env(safe-area-inset-right))",
    "bottom:max(16px,env(safe-area-inset-bottom))",
    "display:inline-flex",
    "align-items:center",
    "justify-content:center",
    "min-height:48px",
    "padding:0 18px",
    "border:1px solid #77d9a7",
    "border-radius:999px",
    "background:#126b49",
    "box-shadow:0 8px 24px #07181066",
    "color:#fff",
    "font:800 14px/1.2 system-ui,-apple-system,Segoe UI,sans-serif",
    "text-decoration:none",
    "letter-spacing:.01em"
  ].join(";");
  document.body.appendChild(button);
})();
