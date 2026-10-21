(function () {
  "use strict";

  const palette = (background, surface, text, muted, accent) => ({
    background, surface, text, muted, accent
  });
  const theme = (id, name, colors, motif, greeting) => ({
    id, name, colors, motif, greeting
  });
  const themes = [
    theme("makar-sankranti", "Makar Sankranti", palette("#fff8e8", "#ffffff", "#17212b", "#455260", "#8b4513"), "🪁", "Udaan bhari ho, chai garam aur din shubh!"),
    theme("maha-shivaratri", "Maha Shivaratri", palette("#f4f1fb", "#ffffff", "#1b1830", "#4c4960", "#46316f"), "🌙", "Shaant raat, sukoon ki chai aur achhi baatein."),
    theme("holi", "Holi", palette("#fff4f7", "#ffffff", "#261522", "#594454", "#a51e58"), "🎨💦", "Rangon ke saath ek pyaali khushiyon ki!"),
    theme("ram-navami", "Ram Navami", palette("#fff7ed", "#ffffff", "#24190e", "#574638", "#8a3e12"), "🏹", "Aaj ka din ho sukoon aur achhe vichaaron ke naam."),
    theme("raksha-bandhan", "Raksha Bandhan", palette("#fff5f2", "#ffffff", "#261713", "#5c4640", "#963d35"), "🧵", "Apno ke saath chai ka ek extra cup banta hai."),
    theme("janmashtami", "Janmashtami", palette("#f3f7ff", "#ffffff", "#111c34", "#44516a", "#264a86"), "🪈", "Masti, mithaas aur chai ke saath shaam yaadgaar."),
    theme("ganesh-chaturthi", "Ganesh Chaturthi", palette("#fff6eb", "#ffffff", "#24180e", "#584535", "#8c4315"), "🌼", "Nayi shuruaat ke saath ek taza chai break."),
    theme("navratri", "Navratri", palette("#fff3f0", "#ffffff", "#281614", "#604440", "#963529"), "💃", "Garba ke josh ke beech chai ka chhota break!"),
    theme("dussehra", "Dussehra", palette("#fff7e8", "#ffffff", "#21180e", "#574631", "#86400f"), "🏹", "Achhe din, achhi dosti aur ek garam chai."),
    theme("dhanteras", "Dhanteras", palette("#fff7e8", "#ffffff", "#21180e", "#574631", "#85440d"), "🪔", "Roshni aur garmahat—dono ek cup mein."),
    theme("diwali", "Diwali", palette("#fff5e8", "#ffffff", "#22160f", "#5b4539", "#8c3c12"), "🪔🎆", "Diye si roshni, chai si garmahat. Shubh Diwali!"),
    theme("bhai-dooj", "Bhai Dooj", palette("#fff5e8", "#ffffff", "#22160f", "#5b4539", "#8c3c12"), "✨", "Apno ke naam ek aur chai aur muskurahat."),
    theme("chhath", "Chhath", palette("#fff7e8", "#ffffff", "#21190e", "#5a4932", "#82420d"), "🌅", "Subah ki taazgi aur shaam ki chai mubarak."),
    theme("gita-jayanti", "Gita Jayanti", palette("#f6f5ed", "#ffffff", "#202016", "#505044", "#57502a"), "📜", "Thoda gyaan, thoda aaram, aur ek cup chai."),
    theme("republic-day", "Republic Day", palette("#fff8ee", "#ffffff", "#21190f", "#5b4937", "#1f5c3a"), "🇮🇳", "Padhai, pragati aur ekta ko ek toast!"),
    theme("independence-day", "Independence Day", palette("#fff8ee", "#ffffff", "#21190f", "#5b4937", "#1f5c3a"), "🇮🇳", "Azadi ki khushi, doston ke saath chai ki chuski."),
    theme("gandhi-jayanti", "Gandhi Jayanti", palette("#f7f7ef", "#ffffff", "#202016", "#505044", "#55532c"), "🕊️", "Simplicity, sukoon aur ek shaant chai break."),
    theme("event-cricket", "Cricket match (example)", palette("#eff8f0", "#ffffff", "#122218", "#405446", "#245b32"), "🏏", "Match ka josh, chai ka dose—doston ke saath!"),
    theme("event-results", "Result day (example)", palette("#f3f5ff", "#ffffff", "#161b30", "#454b62", "#334379"), "📝", "Result kuch bhi ho, chai aur dosti pakki."),
    theme("month-jan", "January · Cool kite-sky", palette("#eef6fb", "#ffffff", "#14212b", "#43515b", "#31566b"), "🪁", "Naye saal ki padhai, naye iraade aur garam chai."),
    theme("month-feb", "February · Spring pink", palette("#fff3f6", "#ffffff", "#26151c", "#59434b", "#8e3554"), "🌸", "Dosti, halki dhoop aur ek pink-sa chai break."),
    theme("month-mar", "March · Bright spring", palette("#f2f8ef", "#ffffff", "#172116", "#465443", "#3c5927"), "🌱", "Nayi roshni mein padhai aur chai dono fresh."),
    theme("month-apr", "April · Early summer", palette("#fff7ed", "#ffffff", "#25180e", "#584635", "#84420f"), "☀️", "Dhoop tez ho toh chai break thoda lamba."),
    theme("month-may", "May · Hot day, cool blue", palette("#eef7fb", "#ffffff", "#12212a", "#43515a", "#24536c"), "🧊", "Garmi ko bye, cool sip ke saath padhai hi-fi."),
    theme("month-jun", "June · Pre-monsoon", palette("#f0f7f5", "#ffffff", "#14211e", "#43524f", "#28544a"), "🌦️", "Badal aane se pehle, chai aur notes ready."),
    theme("month-jul", "July · Monsoon green", palette("#eef6ef", "#ffffff", "#142018", "#435046", "#31543a"), "🌧️", "Baarish ki boondein, chai aur doston ki baatein."),
    theme("month-aug", "August · Monsoon green-grey", palette("#f0f4f3", "#ffffff", "#18201f", "#47514f", "#40524b"), "☔", "Grey skies, warm chai, aur padhai ka flow."),
    theme("month-sep", "September · Fresh light", palette("#f3f8f2", "#ffffff", "#172017", "#455044", "#3b5b34"), "🍃", "Fresh hawa aur fresh notes—chai ke saath."),
    theme("month-oct", "October · Warm autumn", palette("#fff5eb", "#ffffff", "#24180f", "#594638", "#85420f"), "🍂", "Thandi hoti shaam, garam chai aur dosti."),
    theme("month-nov", "November · Winter chai brown", palette("#f7f1e9", "#ffffff", "#21180f", "#57483a", "#694322"), "☕", "Sardi ki shuruaat, chai ki pehli extra chuski."),
    theme("month-dec", "December · Cozy cream and red", palette("#fff5ef", "#ffffff", "#241714", "#59423d", "#8a3430"), "🎄", "Cozy vibes, garam chai aur year-end wali dosti.")
  ];

  const quotes = [
    "Chai garam, notes khule, aaj ka din apna.",
    "Ek cup chai, phir ek chapter aur.",
    "Dost saath hon toh break bhi productive lagta hai.",
    "Cafe ki table, padhai ke plans, chai ke naam.",
    "Chhoti si chai, bade se sapne.",
    "Padhai ke beech wali chai sabse khaas.",
    "Dosti aur adrak chai—dono mood bana dete hain.",
    "Aaj ka goal: ek topic, ek cup, no stress.",
    "Cafe ki halki awaaz, dimaag mein naya idea.",
    "Chai share karo, notes bhi share ho jayenge.",
    "Deadline paas hai, chai tumhare saath hai.",
    "Ek sip lo, phir apne pace se aage badho.",
    "Doston ki baat aur chai ki bhaap—perfect scene.",
    "Har page ke baad ek chhota sa chai break.",
    "Cafe mein milte hain, ideas lekar aana.",
    "Padhai ka plan simple: chai, focus, repeat.",
    "Ek table, do dost, aur dher saari possibilities.",
    "Garam cup pakdo, mushkil sawaal suljhao.",
    "Chai ke saath revision thoda halka lagta hai.",
    "Aaj ki mehnat ko ek achhi chai salaam.",
    "Dost bula rahe? Notes bhi le aana.",
    "Cafe corner mein naye iraade bante hain.",
    "Chai pe charcha, phir padhai ki baari.",
    "Thoda focus, thodi hasi, ek cup chai.",
    "Saath padhoge toh raasta aasaan lagega.",
    "Ek break lo, phir apni kahani likho.",
    "Chai ki chuski ke saath ideas ko jagah do.",
    "Aaj ka revision kal ka confidence hai.",
    "Dosti ka adda aur chai ka cup, dono zaroori.",
    "Padhai chalte rahe, chai milti rahe."
  ];

  const byId = new Map(themes.map((entry) => [entry.id, entry]));
  const monthIds = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
  });
  const hourFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", hour: "2-digit", hourCycle: "h23"
  });

  function istDate(now) {
    const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function istHour(now) {
    return Number(hourFormatter.format(now));
  }

  function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  }

  function quoteForDate(date) {
    const dayNumber = Math.floor((Date.parse(`${date}T00:00:00Z`) - Date.UTC(2020, 0, 1)) / 86400000);
    return quotes[((dayNumber % quotes.length) + quotes.length) % quotes.length];
  }

  function monthTheme(date) {
    return byId.get(`month-${monthIds[Number(date.slice(5, 7)) - 1]}`) || byId.get("month-jan");
  }

  function calendarMatch(date, calendar) {
    if (!calendar) return null;
    const festivals = Array.isArray(calendar.festivals) ? calendar.festivals : [];
    const nationals = Array.isArray(calendar.nationalDays) ? calendar.nationalDays : [];
    const exact = festivals.concat(nationals).find((item) =>
      item.date === date || (item.repeat === "yearly" && item.monthDay === date.slice(5))
    );
    if (exact && byId.has(exact.id)) return byId.get(exact.id);

    // Use the Diwali palette across the supplied 2026 festival window.
    if (date >= "2026-11-06" && date <= "2026-11-11") return byId.get("diwali");

    const events = Array.isArray(calendar.eventDays) ? calendar.eventDays : [];
    const event = events.find((item) => !item.example && item.date === date);
    if (event && byId.has(event.themeId || event.id)) return byId.get(event.themeId || event.id);
    return null;
  }

  function choose(date, calendar, forcedTheme) {
    if (forcedTheme && byId.has(forcedTheme)) return byId.get(forcedTheme);
    return calendarMatch(date, calendar) || monthTheme(date);
  }

  function applyColors(element, selected, night) {
    const colors = selected.colors;
    element.style.setProperty("--theme-background", night ? "#171a1d" : colors.background);
    element.style.setProperty("--theme-surface", night ? "#24292d" : colors.surface);
    element.style.setProperty("--theme-text", night ? "#f7f8f5" : colors.text);
    element.style.setProperty("--theme-muted", night ? "#d0d5d8" : colors.muted);
    element.style.setProperty("--theme-accent", colors.accent);
    element.style.setProperty("--theme-accent-ink", "#ffffff");
    element.style.setProperty("--theme-motif", `"${selected.motif}"`);
  }

  function ensureLine(parent, className, tagName) {
    let element = parent.querySelector(`.${className}`);
    if (!element) {
      element = document.createElement(tagName);
      element.className = className;
      parent.append(element);
    }
    return element;
  }

  function currentParams(now) {
    const params = new URLSearchParams(window.location.search);
    const requestedDate = params.get("date");
    const requestedHour = params.get("hour");
    const date = requestedDate && validDate(requestedDate) ? requestedDate : istDate(now);
    const hourNumber = requestedHour !== null && /^(?:[0-9]|1[0-9]|2[0-3])$/.test(requestedHour)
      ? Number(requestedHour) : istHour(now);
    return { date, hour: hourNumber, forcedTheme: params.get("theme") };
  }

  function renderMenu(selected, quote, night, previewing) {
    const root = document.documentElement;
    applyColors(root, selected, night);
    root.dataset.themeMode = night ? "dark" : "light";
    root.dataset.themeId = selected.id;
    const header = document.querySelector("body > main header");
    if (header) {
      const greeting = ensureLine(header, "theme-greeting", "p");
      greeting.textContent = selected.greeting;
      const quoteLine = ensureLine(header, "theme-quote", "p");
      quoteLine.textContent = quote;
      const chip = ensureLine(header, "theme-chip", "span");
      chip.textContent = `${previewing ? "Previewing" : "Today"}: ${selected.name}`;
      chip.classList.toggle("is-preview", previewing);
    }
  }

  async function loadCalendar() {
    try {
      const response = await fetch("/c/shared/calendar.json", { cache: "no-cache" });
      if (!response.ok) throw new Error(`Calendar request failed (${response.status})`);
      return await response.json();
    } catch (error) {
      console.warn("Theme calendar unavailable; using the month theme.", error);
      return null;
    }
  }

  const api = { themes, quotes, istDate, istHour, validDate, quoteForDate, monthTheme, choose, applyColors, loadCalendar };
  window.RoomsliderThemeEngine = api;

  if (document.body && document.body.dataset.themePreview !== "true") {
    const { date, hour, forcedTheme } = currentParams(new Date());
    loadCalendar().then((calendar) => {
      const selected = choose(date, calendar, forcedTheme);
      renderMenu(selected, quoteForDate(date), hour >= 19 || hour < 6, Boolean(forcedTheme && byId.has(forcedTheme)));
    });
  }
}());
