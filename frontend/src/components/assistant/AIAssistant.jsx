import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Clock3,
  Home,
  LoaderCircle,
  MapPin,
  Shirt,
  Sparkles,
  Utensils,
  Wifi,
  X,
  Send,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { roomPath } from "../../utils/roomUrl";
import "./AIAssistant.css";

const EXAMPLES = [
  "Room near Vijay Nagar",
  "PG under 6000",
  "Villa near Vijay Nagar",
  "Villa for party",
  "Hourly stay",
  "Mess near Vijay Nagar",
  "Car rental",
  "Bike under 500",
  "Laundry service",
  "Tiffin near Palasia",
  "Wi-Fi / RO",
];

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  text: "Namaste! Room, villa, hourly stay, mess, car-bike ya laundry dhoondhiye. Area ya budget bhi likh sakte hain, jaise “villa near Vijay Nagar under 10000”.",
  results: [],
  cards: [],
};

const serviceIcons = {
  mess: Utensils,
  laundry: Shirt,
  service: Wifi,
  room: Bot,
  hourly: Clock3,
  villa: Home,
};

const comingSoonTitles = [
  "student loan",
  "student loans",
  "furniture rental",
  "wi-fi & ro",
  "wi-fi / ro",
  "study support",
  "moving",
  "rent agreement",
];

function isComingSoonService(result) {
  if (result.type !== "service") return false;
  if (result.comingSoon === true || result.isComingSoon === true || result.live === false) return true;
  return comingSoonTitles.includes(String(result.title || "").trim().toLowerCase());
}

function resultLink(result) {
  if (typeof result.link === "string" && result.link.startsWith("/")) return result.link;
  if (result.type === "room" && result.category && (result.slug || result.title)) {
    return roomPath(result);
  }
  return "/explore";
}

function AssistantResultCard({ result }) {
  const Icon = serviceIcons[result.type] || Sparkles;
  const image = result.image || result.images?.[0];
  const comingSoon = isComingSoonService(result);
  const hourlySlab = result.hourlyEnabled
    ? (result.hourlySlabs || []).filter((slab) => Number(slab.hours) > 0 && Number(slab.price) > 0)
      .sort((first, second) => Number(first.hours) - Number(second.hours))[0]
    : null;
  const price = hourlySlab ? Number(hourlySlab.price) : result.price == null ? null : Number(result.price);
  const closeAssistant = () => window.dispatchEvent(new CustomEvent("roomslider:assistant-close"));

  if (comingSoon) {
    return (
      <p className="ai-assistant-coming-soon-message">
        {result.title}. <Link to="/explore" onClick={closeAssistant}>Explore services</Link>
      </p>
    );
  }

  return (
    <Link to={resultLink(result)} onClick={closeAssistant} className={`ai-assistant-result-card is-${result.type || "service"}`}>
      {image ? (
        <img
          src={optimizeCloudinaryImage(image, 240)}
          alt=""
          className="ai-assistant-result-image"
          loading="lazy"
        />
      ) : (
        <span className="ai-assistant-result-icon" aria-hidden="true"><Icon size={21} /></span>
      )}
      <span className="ai-assistant-result-info">
        <span className="ai-assistant-result-title">
          <strong>{result.title}</strong>
        </span>
        <span className="ai-assistant-result-meta">
          {result.category && <span className="ai-assistant-category">{result.category}</span>}
          {comingSoon && <span className="ai-assistant-coming-soon">Coming Soon</span>}
          {Number.isFinite(price) && (
            <span className="ai-assistant-result-price">
              ₹{price.toLocaleString("en-IN")}{hourlySlab
                ? ` / ${hourlySlab.hours} hrs`
                : result.type === "hourly" ? " / hour"
                  : result.type === "villa" ? (result.subtitle === "per day" ? " / day" : " / night") : ""}
            </span>
          )}
        </span>
        {result.location
          ? <span className="ai-assistant-result-location"><MapPin size={12} />{result.location}</span>
          : result.subtitle && <span className="ai-assistant-result-subtitle">{result.subtitle}</span>}
      </span>
    </Link>
  );
}

function normalizeResults(data) {
  const items = [
    ...(Array.isArray(data.results) ? data.results : []),
    ...(Array.isArray(data.cards) ? data.cards : []),
  ].map((item) => {
    if (item?.type && item.title) return item;
    if (item?._id && item.title && item.category) {
      const path = { Room: "rooms", PG: "pg", Hostel: "hostels", Flat: "flats" }[item.category] || "rooms";
      return {
        ...item,
        type: "room",
        subtitle: [item.sharingType, item.gender === "Female" ? "Girls" : item.gender === "Male" ? "Boys" : null]
          .filter(Boolean)
          .join(" · ") || item.category,
        image: item.images?.[0] || null,
        link: `/${path}/${item.slug || item._id}`,
      };
    }
    return item;
  });
  if (items.length === 0 && Array.isArray(data.rooms)) {
    items.push(...data.rooms.map((room) => {
      if (!room?._id || !room.title || !room.category) return room;
      const path = { Room: "rooms", PG: "pg", Hostel: "hostels", Flat: "flats" }[room.category] || "rooms";
      return {
        ...room,
        type: "room",
        subtitle: [room.sharingType, room.gender === "Female" ? "Girls" : room.gender === "Male" ? "Boys" : null]
          .filter(Boolean)
          .join(" · ") || room.category,
        image: room.images?.[0] || null,
        link: `/${path}/${room.slug || room._id}`,
      };
    }));
  }
  const seen = new Set();
  return items.filter((item) => {
    if (!item || typeof item !== "object" || typeof item.title !== "string") return false;
    const key = `${item.type || ""}:${item.title}:${item.link || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function appendMessages(previous, next) {
  return [...previous, ...next].slice(-10);
}

function AssistantMessage({ item }) {
  const results = item.results || [];
  const groups = item.groups?.length
    ? item.groups
    : results.length ? [{ label: "Results", results }] : [];
  const showEmpty = item.role === "assistant"
    && item.intent
    && ["room_search", "villas_search", "hourly_search", "mess_search", "laundry_search", "service_search", "vehicle_search"].includes(item.intent)
    && groups.every((group) => group.results.length === 0);
  const closeAssistant = () => window.dispatchEvent(new CustomEvent("roomslider:assistant-close"));

  return (
    <div className={`ai-assistant-message-row ${item.role === "user" ? "is-user" : ""}`}>
      {item.role === "assistant" && (
        <span className="ai-assistant-message-avatar">
          <img src="/ai-avatar.webp" alt="" width="28" height="28" decoding="async" />
        </span>
      )}
      {item.text && <div className={`ai-assistant-bubble ${item.error ? "is-error" : ""}`}>{item.text}</div>}
      {item.suggestion?.link?.startsWith("/") && (
        <Link className="ai-assistant-view-all" to={item.suggestion.link} onClick={closeAssistant}>
          {item.suggestion.label || "Explore"}
        </Link>
      )}
      {groups.length > 0 && (
        <>
          {groups.map((group, groupIndex) => group.results.length > 0 && (
            <section className="ai-assistant-result-group" key={`${group.label}-${groupIndex}`}>
              <h3>{group.label}</h3>
              <div className="ai-assistant-results" aria-label={`${group.label} search results`}>
                {group.results.map((result, index) => (
                  <AssistantResultCard key={`${result.type}-${result.title}-${index}`} result={result} />
                ))}
              </div>
            </section>
          ))}
          {item.hasMore && (
            <Link className="ai-assistant-view-all" to={item.viewAllLink || "/rooms"} onClick={closeAssistant}>
              View all on map / list
            </Link>
          )}
        </>
      )}
      {showEmpty && <p className="ai-assistant-empty">Abhi koi matching result nahi mila. Area ya budget badal kar try karein.</p>}
    </div>
  );
}

function AIAssistant({ initialOpen = false, onClose }) {
  const [open, setOpen] = useState(initialOpen);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [viewportHeight, setViewportHeight] = useState(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("roomslider:assistant-visibility", {
      detail: { open },
    }));
    return () => {
      window.dispatchEvent(new CustomEvent("roomslider:assistant-visibility", {
        detail: { open: false },
      }));
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const visualViewport = window.visualViewport;
    const updateViewport = () => {
      setViewportHeight(visualViewport?.height || window.innerHeight);
      setKeyboardInset(visualViewport
        ? Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop)
        : 0);
    };
    updateViewport();
    visualViewport?.addEventListener("resize", updateViewport);
    visualViewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);
    return () => {
      visualViewport?.removeEventListener("resize", updateViewport);
      visualViewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    inputRef.current?.focus();
  }, [messages, loading, open]);

  const sendMessage = async (value = message) => {
    const text = value.trim();
    if (!text || text.length > 300 || loading) return;

    setMessages((previous) => appendMessages(previous, [{
      id: `${Date.now()}-user`,
      role: "user",
      text,
      results: [],
    }]));
    setMessage("");
    setLoading(true);

    try {
      const { data } = await api.post("/assistant", { message: text });
      const results = normalizeResults(data);
      const groups = Array.isArray(data.groups)
        ? data.groups.map((group) => ({
            label: typeof group.label === "string" ? group.label : "Results",
            results: normalizeResults({ results: group.results }),
          }))
        : [];
      if (import.meta.env.DEV) {
        console.debug("AI ASSISTANT API RESPONSE:", data);
        const rawResultCount = (Array.isArray(data.results) ? data.results.length : 0)
          + (Array.isArray(data.cards) ? data.cards.length : 0)
          + (Array.isArray(data.rooms) ? data.rooms.length : 0);
        if (rawResultCount > 0 && results.length === 0) {
          console.error("AI assistant received results but could not render result cards.", data);
        }
      }
      setMessages((previous) => appendMessages(previous, [{
        id: `${Date.now()}-assistant`,
        role: "assistant",
        text: data.reply || "Samajh gaya. Aap thoda aur detail bata sakte hain?",
        intent: data.intent,
        results,
        groups,
        suggestion: data.suggestion && typeof data.suggestion.link === "string" && data.suggestion.link.startsWith("/")
          ? data.suggestion
          : null,
        hasMore: data.hasMore === true || Number(data.total) > results.length,
        viewAllLink: typeof data.viewAllLink === "string" && data.viewAllLink.startsWith("/")
          ? data.viewAllLink
          : "/rooms",
      }]));
    } catch (error) {
      const status = error.response?.status;
      const text = status === 429
        ? "Bahut saari requests aa gayi hain—thodi der baad try karein."
        : error.response?.data?.message || "Abhi connect nahi ho pa raha. Thodi der baad dobara try karein.";
      setMessages((previous) => appendMessages(previous, [{
        id: `${Date.now()}-error`,
        role: "assistant",
        text,
        results: [],
        error: true,
      }]));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([{
      ...WELCOME_MESSAGE,
      id: `${Date.now()}-welcome`,
    }]);
    setMessage("");
  };

  const panelStyle = {
    "--assistant-viewport-height": viewportHeight ? `${viewportHeight}px` : "100dvh",
    "--assistant-keyboard-inset": `${keyboardInset}px`,
  };

  return (
    <div className="ai-assistant">
      {open && (
        <section className="ai-assistant-panel" style={panelStyle} aria-label="RoomSlider AI Assistant">
          <header className="ai-assistant-header">
            <span className="ai-assistant-avatar">
              <img src="/ai-avatar.webp" alt="" width="28" height="28" decoding="async" />
            </span>
            <span className="ai-assistant-heading">
              <strong>RoomSlider AI Assistant</strong>
              <small>Rooms, villas, services & more</small>
            </span>
            <button type="button" className="ai-assistant-clear" onClick={clearChat} aria-label="Clear chat">
              <Trash2 size={16} />
              <span>Clear</span>
            </button>
            <button
              type="button"
              className="ai-assistant-close"
              onClick={() => {
                setOpen(false);
                onClose?.();
              }}
              aria-label="Close assistant"
            >
              <X size={20} />
            </button>
          </header>

          <div className="ai-assistant-messages" aria-live="polite">
            {messages.map((item) => <AssistantMessage key={item.id} item={item} />)}
            {messages.length === 1 && !loading && (
              <div className="ai-assistant-examples" aria-label="Example searches">
                {EXAMPLES.map((example) => (
                  <button key={example} type="button" onClick={() => sendMessage(example)}>{example}</button>
                ))}
              </div>
            )}
            {loading && (
              <div className="ai-assistant-typing" role="status" aria-label="Searching">
                <i /><i /><i />
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="ai-assistant-form"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              ref={inputRef}
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 300))}
              placeholder="Room, villa, area ya budget likhein..."
              maxLength={300}
              aria-label="Ask RoomSlider AI Assistant"
            />
            <button type="submit" disabled={!message.trim() || loading} aria-label="Send message">
              {loading ? <LoaderCircle size={19} className="ai-assistant-spinner" /> : <Send size={18} />}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

export default AIAssistant;
