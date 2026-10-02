import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

const formatTime = (value) => new Date(value).toLocaleString([], {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function RoommateChat({ person, currentUserId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    let active = true;
    const loadMessages = async (showError = false) => {
      try {
        const response = await api.get(`/roommates/chat/${person.id}`);
        if (active) {
          setMessages(response.data.messages || []);
          setChatError("");
        }
      } catch (error) {
        if (active && showError) {
          const message = error.response?.data?.message || "Chat could not be loaded";
          setChatError(message);
          toast.error(message);
        }
      } finally {
        if (active && showError) setLoading(false);
      }
    };
    loadMessages(true);
    const interval = window.setInterval(() => loadMessages(), 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [person.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const send = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    try {
      setSending(true);
      const response = await api.post(`/roommates/chat/${person.id}`, { body });
      setMessages((current) => [...current, response.data.message]);
      setDraft("");
      setChatError("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Message could not be sent");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="roommate-chat" aria-label={`Chat with ${person.name}`}>
      <header className="roommate-chat-header">
        <div>
          <h3>Private chat with {person.name}</h3>
          <p>Only you and this accepted connection can read these messages.</p>
        </div>
        <button type="button" className="roommate-chat-close" onClick={onClose}>Close</button>
      </header>
      <div className="roommate-chat-messages" aria-live="polite">
        {loading ? <p className="profile-hint">Loading messages...</p> : null}
        {!loading && messages.length === 0 ? <p className="profile-hint">Say hello to start your conversation.</p> : null}
        {chatError && !loading ? <p className="roommate-chat-error">{chatError}</p> : null}
        {messages.map((message) => {
          const mine = message.from === String(currentUserId);
          return (
            <article className={`roommate-chat-message${mine ? " is-mine" : ""}`} key={message.id}>
              <p>{message.body}</p>
              <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
            </article>
          );
        })}
        <div ref={endRef} />
      </div>
      <form className="roommate-chat-compose" onSubmit={send}>
        <textarea
          aria-label="Write a private message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message..."
          rows={2}
          maxLength={2000}
          required
        />
        <button type="submit" disabled={sending || !draft.trim()} aria-label="Send message">
          <Send size={17} /> {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}

export default RoommateChat;
