import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../api/axios";
import { useNotifications } from "../../context/useNotifications";
import RoommateSubnav from "./RoommateSubnav";
import "../../styles/roommate-chat.css";

const relativeTime = (value) => {
  if (!value) return "";
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d` : new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

function RoommateMessages() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const { roommateBadges } = useNotifications();

  const loadConversations = useCallback(async () => {
    try {
      const response = await api.get("/roommates/conversations");
      setResult(response.data.conversations || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Messages could not be loaded");
      setResult([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadConversations);
  }, [loadConversations, roommateBadges.unreadMessages]);

  return (
    <main className="roommate-hub-page">
      <RoommateSubnav active="messages" />
      <header className="roommate-hub-heading">
        <p className="roommate-hub-eyebrow">Roommate Finder</p>
        <h1>Messages</h1>
        <p>Private conversations with accepted roommate connections.</p>
      </header>
      <section className="roommate-hub-list" aria-live="polite">
        {loading ? (
          <div className="roommate-hub-skeletons">
            {[1, 2, 3].map((item) => <div className="roommate-hub-skeleton" key={item} />)}
          </div>
        ) : !result?.length ? (
          <div className="roommate-hub-empty">
            <span className="roommate-hub-empty-icon"><MessageCircle size={22} /></span>
            <h2>No messages yet</h2>
            <p>Chat opens here after a roommate request is accepted.</p>
            <button type="button" className="roommate-primary-action" onClick={() => navigate("/roommates/requests")}>View requests</button>
          </div>
        ) : result.map((conversation) => (
          <button
            className="roommate-conversation-row"
            type="button"
            key={conversation.id}
            onClick={() => {
              navigate(`/roommates/chat/${conversation.id}`, { state: { person: conversation } });
            }}
          >
            {conversation.avatar
              ? <img src={conversation.avatar} alt="" />
              : <span className="roommate-hub-avatar">{conversation.name?.charAt(0)?.toUpperCase() || "R"}</span>}
            <span className="roommate-conversation-copy">
              <strong>{conversation.name}</strong>
              <small>{conversation.lastMessage || "Start a conversation"}</small>
            </span>
            <span className="roommate-conversation-meta">
              <time>{relativeTime(conversation.lastMessageAt)}</time>
              {conversation.unreadCount > 0 && <b>{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</b>}
            </span>
          </button>
        ))}
      </section>
    </main>
  );
}

export default RoommateMessages;
