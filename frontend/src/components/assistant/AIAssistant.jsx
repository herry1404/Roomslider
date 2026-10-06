import { useEffect, useRef, useState } from "react";
import { Bot, LoaderCircle, MapPin, Send, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { roomPath } from "../../utils/roomUrl";
import "./AIAssistant.css";

const EXAMPLES = ["PG under 6000", "Girls hostel near DAVV", "1BHK flat"];

function AssistantRoomCard({ room }) {
  const image = room.images?.[0];
  const typeLine = [room.sharingType, room.gender === "Female" ? "Girls" : room.gender === "Male" ? "Boys" : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link to={roomPath(room)} className="room-card ai-assistant-result">
      {image ? (
        <img
          src={optimizeCloudinaryImage(image, 240)}
          alt=""
          className="room-image"
          loading="lazy"
        />
      ) : (
        <div className="ai-assistant-result-placeholder"><Bot size={22} /></div>
      )}
      <span className="ai-assistant-result-info">
        <strong>{room.title}</strong>
        <span className="ai-assistant-result-price">₹{Number(room.price || 0).toLocaleString()}<small>/month</small></span>
        <span className="ai-assistant-result-meta">{typeLine || room.category}</span>
        <span className="ai-assistant-result-location"><MapPin size={12} />{room.location}</span>
      </span>
    </Link>
  );
}

function AIAssistant({ initialOpen = false, onClose }) {
  const [open, setOpen] = useState(initialOpen);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! Tell me your budget, area, or room type and I’ll find available rooms.",
      rooms: [],
    },
  ]);
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
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      inputRef.current?.focus();
    }
  }, [messages, loading, open]);

  const sendMessage = async (value = message) => {
    const text = value.trim();
    if (!text || text.length > 300 || loading) return;

    setMessages((previous) => [...previous, {
      id: `${Date.now()}-user`,
      role: "user",
      text,
      rooms: [],
    }]);
    setMessage("");
    setLoading(true);

    try {
      const { data } = await api.post("/assistant", { message: text });
      setMessages((previous) => [...previous, {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        text: data.reply,
        rooms: data.rooms || [],
      }]);
    } catch (error) {
      setMessages((previous) => [...previous, {
        id: `${Date.now()}-error`,
        role: "assistant",
        text: error.response?.data?.message || "Could not connect right now. Please try again.",
        rooms: [],
        error: true,
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="ai-assistant">
      {open && (
        <section className="ai-assistant-panel" aria-label="AI Room Finder">
          <header className="ai-assistant-header">
            <span className="ai-assistant-avatar"><Sparkles size={19} /></span>
            <span className="ai-assistant-heading">
              <strong>AI Room Finder</strong>
              <small>Find your next place</small>
            </span>
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
            {messages.map((item) => (
              <div key={item.id} className={`ai-assistant-message-row ${item.role === "user" ? "is-user" : ""}`}>
                <div className={`ai-assistant-bubble ${item.error ? "is-error" : ""}`}>{item.text}</div>
                {item.rooms.length > 0 && (
                  <div className="ai-assistant-results">
                    {item.rooms.map((room) => <AssistantRoomCard key={room._id} room={room} />)}
                  </div>
                )}
              </div>
            ))}
            {messages.length === 1 && !loading && (
              <div className="ai-assistant-examples" aria-label="Example searches">
                {EXAMPLES.map((example) => (
                  <button key={example} type="button" onClick={() => sendMessage(example)}>{example}</button>
                ))}
              </div>
            )}
            {loading && (
              <div className="ai-assistant-typing" role="status" aria-label="Searching for rooms">
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
              placeholder="Budget, area, room type..."
              maxLength={300}
              aria-label="Describe the room you are looking for"
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
