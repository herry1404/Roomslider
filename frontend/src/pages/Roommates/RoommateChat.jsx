import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Ban, Check, CheckCheck, ImagePlus, MapPin, Send, ShieldAlert, X } from "lucide-react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useNotifications } from "../../context/useNotifications";
import confirmAction from "../../utils/confirmAction";

const dateLabel = (value) => {
  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((today - messageDay) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const formatTime = (value) => new Date(value).toLocaleTimeString("en-IN", {
  hour: "numeric",
  minute: "2-digit",
});

const apiOrigin = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

function RoommateChat({ person, currentUserId, onClose, compact = false }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [relatedRoom, setRelatedRoom] = useState(null);
  const [presence, setPresence] = useState({ online: false, lastSeen: null });
  const [typing, setTyping] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const fileInput = useRef(null);
  const endRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimer = useRef(null);
  const messageCounter = useRef(0);
  const { refreshRoommateBadges, loadLatest } = useNotifications();

  useEffect(() => {
    let active = true;
    const loadMessages = async (showError = false) => {
      try {
        const response = await api.get(`/roommates/chat/${person.id}`);
        if (!active) return;
        setMessages(response.data.messages || []);
        setRelatedRoom(response.data.relatedRoom || null);
        setChatError("");
        const unread = (response.data.messages || []).some(
          (message) => message.from !== String(currentUserId) && !message.readAt
        );
        if (unread) await Promise.all([
          api.put(`/roommates/conversations/${person.id}/read`),
          refreshRoommateBadges(),
          loadLatest(),
        ]);
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
    const socket = io(apiOrigin, { auth: { token: localStorage.getItem("token") } });
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("roommate:join", { userId: person.id }, (state) => {
        if (state?.success) setPresence({ online: state.online, lastSeen: state.lastSeen });
      });
    });
    socket.on("roommate:message", (message) => {
      if (String(message.from) === person.id && message.from !== String(currentUserId)) {
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
        api.put(`/roommates/conversations/${person.id}/read`)
          .then(() => Promise.all([refreshRoommateBadges(), loadLatest()]))
          .catch((error) => toast.error(error.response?.data?.message || "Message could not be marked as read"));
      }
    });
    socket.on("roommate:seen", ({ userId, readAt }) => {
      if (String(userId) !== person.id) return;
      setMessages((current) => current.map((message) =>
        message.from === String(currentUserId)
          ? { ...message, readAt: message.readAt || readAt, isRead: true }
          : message
      ));
    });
    socket.on("roommate:typing", (event) => {
      if (String(event.userId) === person.id) setTyping(Boolean(event.isTyping));
    });
    socket.on("roommate:presence", (event) => {
      if (String(event.userId) === person.id) setPresence({ online: event.online, lastSeen: event.lastSeen });
    });
    const fallbackPoll = window.setInterval(() => {
      if (!socket.connected) loadMessages();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(fallbackPoll);
      window.clearTimeout(typingTimer.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, loadLatest, person.id, refreshRoommateBadges]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const sendText = async (text) => {
    const body = text.trim();
    if (!body || sending) return;
    const clientId = `pending-${++messageCounter.current}`;
    setMessages((current) => [...current, {
      id: clientId, from: String(currentUserId), body, createdAt: new Date().toISOString(), sending: true,
    }]);
    setDraft("");
    setSending(true);
    try {
      const response = await api.post(`/roommates/chat/${person.id}`, { body });
      setMessages((current) => current.map((message) => message.id === clientId ? response.data.message : message));
      setChatError("");
    } catch (error) {
      setMessages((current) => current.map((message) => message.id === clientId ? { ...message, sending: false, failed: true } : message));
      setChatError(error.response?.data?.message || "Message could not be sent. Tap to retry.");
      toast.error(error.response?.data?.message || "Message could not be sent");
    } finally {
      setSending(false);
    }
  };

  const send = (event) => {
    event.preventDefault();
    sendText(draft);
  };

  const sendImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Images must be 5 MB or smaller");
    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);
    try {
      const response = await api.post(`/roommates/chat/${person.id}/image`, formData);
      setMessages((current) => [...current, response.data.message]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Image could not be sent");
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = (event) => {
    setDraft(event.target.value);
    socketRef.current?.emit("roommate:typing", { userId: person.id, isTyping: true });
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      socketRef.current?.emit("roommate:typing", { userId: person.id, isTyping: false });
    }, 1200);
  };

  const block = async () => {
    if (!await confirmAction(`Block ${person.name}? They will no longer be able to message you.`, { confirmText: "Block" })) return;
    try {
      await api.post(`/roommates/block/${person.id}`);
      toast.success("User blocked");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "User could not be blocked");
    }
  };

  const report = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/roommates/report/${person.id}`, { reason: reportReason });
      toast.success("Report submitted for review");
      setReportOpen(false);
      setReportReason("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Report could not be submitted");
    }
  };

  const chat = (
    <section className={`roommate-chat${compact ? " roommate-chat--embedded" : ""}`} aria-label={`Chat with ${person.name}`}>
      <header className="roommate-chat-header">
        {onClose && <button type="button" className="roommate-chat-back" onClick={onClose} aria-label="Back to roommate messages"><ArrowLeft size={20} /></button>}
        {person.avatar
          ? <img className="roommate-chat-avatar" src={optimizeCloudinaryImage(person.avatar, 256)} alt="" loading="lazy" />
          : <span className="roommate-chat-avatar roommate-chat-avatar--initial">{person.name?.trim().charAt(0).toUpperCase() || "R"}</span>}
        <div className="roommate-chat-person">
          <h3>{person.name}</h3>
          <p>{typing ? "Typing…" : presence.online ? "Online" : presence.lastSeen ? `Last seen ${formatTime(presence.lastSeen)}` : "Private roommate chat"}</p>
        </div>
        <div className="roommate-chat-actions">
          <button type="button" aria-label="Report user" title="Report user" onClick={() => setReportOpen(true)}><ShieldAlert size={17} /></button>
          <button type="button" aria-label="Block user" title="Block user" onClick={block}><Ban size={17} /></button>
        </div>
      </header>
      {relatedRoom && <a className="roommate-related-room" href={`/rooms/${relatedRoom.slug || relatedRoom.id}`}>
        {relatedRoom.image ? <img src={optimizeCloudinaryImage(relatedRoom.image, 640)} alt="" loading="lazy" /> : <span className="roommate-related-room-icon"><MapPin size={17} /></span>}
        <span><small>Room near their area</small><strong>{relatedRoom.title}</strong><small>{relatedRoom.location} · ₹{Number(relatedRoom.price).toLocaleString("en-IN")}/month</small></span>
        <span className="roommate-related-room-tag">{relatedRoom.category}</span>
      </a>}
      <div className="roommate-chat-messages" aria-live="polite">
        {loading && <p className="profile-hint">Loading messages…</p>}
        {!loading && messages.length === 0 && <p className="profile-hint">Say hello to start your conversation.</p>}
        {chatError && !loading && <p className="roommate-chat-error">{chatError}</p>}
        {messages.map((message, index) => {
          const mine = message.from === String(currentUserId);
          const day = dateLabel(message.createdAt);
          const showDate = index === 0 || dateLabel(messages[index - 1].createdAt) !== day;
          return (
            <div key={message.id}>
              {showDate && <div className="roommate-chat-date"><span>{day}</span></div>}
              <article className={`roommate-chat-message${mine ? " is-mine" : ""}${message.failed ? " is-failed" : ""}`} onClick={message.failed ? () => sendText(message.body) : undefined}>
                {message.imageUrl && <a href={message.imageUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}><img className="roommate-chat-image" src={optimizeCloudinaryImage(message.imageUrl, 640)} alt="Shared image" loading="lazy" /></a>}
                {message.body && <p>{message.body}</p>}
                <time dateTime={message.createdAt}>{formatTime(message.createdAt)}{mine && <span className="roommate-message-status" aria-label={message.failed ? "Failed to send" : message.isRead || message.readAt ? "Seen" : "Sent"}>{message.failed ? "Failed · Retry" : message.sending ? "Sending…" : message.isRead || message.readAt ? <CheckCheck size={14} /> : <Check size={14} />}</span>}</time>
              </article>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form className="roommate-chat-compose" onSubmit={send}>
        <input ref={fileInput} type="file" accept="image/*" onChange={sendImage} hidden />
        <button className="roommate-chat-image-button" type="button" onClick={() => fileInput.current?.click()} disabled={uploading} aria-label="Send image" title="Send image (max 5 MB)">
          {uploading ? <span className="roommate-upload-spinner" /> : <ImagePlus size={19} />}
        </button>
        <textarea
          aria-label="Write a private message"
          value={draft}
          onChange={handleTyping}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendText(draft);
            }
          }}
          placeholder="Write a message…"
          rows={1}
          maxLength={2000}
        />
        <button type="submit" disabled={sending || !draft.trim()} aria-label="Send message">
          <Send size={17} />
          <span>{sending ? "Sending…" : "Send"}</span>
        </button>
      </form>
      {reportOpen && <div className="roommate-report-overlay" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setReportOpen(false);
      }}>
        <form className="roommate-report-modal" onSubmit={report}>
          <button type="button" className="roommate-report-close" aria-label="Close report dialog" onClick={() => setReportOpen(false)}><X size={18} /></button>
          <h2>Report {person.name}</h2>
          <p>Tell us what happened. Our team will review your report.</p>
          <textarea value={reportReason} maxLength={500} onChange={(event) => setReportReason(event.target.value)} placeholder="Describe the issue (optional)" />
          <button className="roommate-primary-action" type="submit">Submit report</button>
        </form>
      </div>}
    </section>
  );

  return compact ? chat : <main className="roommate-chat-page">{chat}</main>;
}

export default RoommateChat;
