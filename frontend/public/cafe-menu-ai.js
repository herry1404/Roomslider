(function () {
  var body = document.body;
  var params = new URLSearchParams(window.location.search);
  var location = params.get("location") || body.dataset.location || "";
  var apiUrl = "https://roomslider-api.onrender.com/api/cafe-menu-search";

  var launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "cafe-ai-launcher";
  launcher.textContent = "Ask AI about menus";
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "cafe-ai-panel");

  var panel = document.createElement("section");
  panel.className = "cafe-ai-panel";
  panel.id = "cafe-ai-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Cafe menu AI search");
  panel.innerHTML = '<header><strong>RoomSlider Menu AI</strong><button type="button" aria-label="Close menu assistant">×</button></header><p>Search menu items across cafes. Results are filtered for this area.</p><div class="cafe-ai-results" role="log" aria-live="polite">Try “biryani”, “coffee” or “pizza”.</div><form><input type="search" maxlength="120" placeholder="What are you craving?" aria-label="Search cafe menus" required><button type="submit">Search</button></form>';

  var closeButton = panel.querySelector("header button");
  var form = panel.querySelector("form");
  var input = form.querySelector("input");
  var submit = form.querySelector("button");
  var results = panel.querySelector(".cafe-ai-results");

  function closePanel() {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
  }

  launcher.addEventListener("click", function () {
    panel.hidden = !panel.hidden;
    launcher.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) input.focus();
  });
  closeButton.addEventListener("click", closePanel);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var message = input.value.trim();
    if (!message || submit.disabled) return;
    submit.disabled = true;
    results.textContent = "Checking cafe menus…";

    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "omit",
      body: JSON.stringify({ message: message, location: location })
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) throw new Error(data.message || "Menu search failed.");
          return data;
        });
      })
      .then(function (data) {
        results.replaceChildren();
        var reply = document.createElement("p");
        reply.textContent = data.reply;
        results.appendChild(reply);
        (data.items || []).forEach(function (item) {
          var link = document.createElement("a");
          link.href = item.menuUrl;
          link.textContent = item.cafe + " · " + item.name + " · " + (item.price || "Price not listed");
          link.target = "_blank";
          link.rel = "noopener";
          results.appendChild(link);
        });
      })
      .catch(function (error) {
        results.textContent = error.message || "Menu search is temporarily unavailable.";
      })
      .finally(function () {
        submit.disabled = false;
      });
  });

  var style = document.createElement("style");
  style.textContent = ".cafe-ai-launcher{position:fixed;right:16px;bottom:16px;z-index:90;border:0;border-radius:999px;background:#166534;color:#fff;padding:12px 17px;font:700 14px system-ui,sans-serif;box-shadow:0 5px 20px #0004;cursor:pointer}.cafe-ai-panel{position:fixed;right:16px;bottom:76px;z-index:91;width:min(380px,calc(100vw - 24px));max-height:min(560px,calc(100vh - 100px));overflow:auto;padding:14px;border:1px solid #64748b;border-radius:16px;background:#0f172a;color:#f8fafc;font:14px/1.45 system-ui,sans-serif;box-shadow:0 12px 38px #0007}.cafe-ai-panel[hidden]{display:none}.cafe-ai-panel header{display:flex;align-items:center;justify-content:space-between;padding:0 0 8px;text-align:left}.cafe-ai-panel header strong{font-size:16px}.cafe-ai-panel header button{border:0;background:none;color:inherit;font-size:24px;cursor:pointer}.cafe-ai-panel>p{margin:0 0 10px;color:#cbd5e1;font-size:12px}.cafe-ai-results{display:grid;gap:7px;max-height:280px;overflow:auto;padding:10px;border-radius:10px;background:#1e293b}.cafe-ai-results p{margin:0;white-space:pre-line}.cafe-ai-results a{color:#86efac;text-decoration:none}.cafe-ai-results a:hover{text-decoration:underline}.cafe-ai-panel form{display:flex;gap:7px;margin-top:10px}.cafe-ai-panel input{flex:1;min-width:0;border:1px solid #64748b;border-radius:9px;background:#1e293b;color:#fff;padding:10px;font:inherit}.cafe-ai-panel form button{border:0;border-radius:9px;background:#16a34a;color:#fff;padding:0 13px;font-weight:700;cursor:pointer}.cafe-ai-panel button:disabled{opacity:.6;cursor:wait}@media(max-width:420px){.cafe-ai-launcher{right:10px;bottom:10px}.cafe-ai-panel{right:10px;bottom:68px}}";
  document.head.appendChild(style);
  document.body.appendChild(launcher);
  document.body.appendChild(panel);
})();
