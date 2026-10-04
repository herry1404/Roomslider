import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/useNotifications";
import RoommateSubnav from "./RoommateSubnav";
import RoommateChat from "./RoommateChat";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import confirmAction from "../../utils/confirmAction";
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
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState("");
  const { user } = useAuth();
  const { roommateBadges } = useNotifications();
  const currentUserId = user?._id || user?.id;

  const loadConversations = useCallback(async () => {
    try {
      const response = await api.get("/roommates/conversations");
      setConversations(response.data.conversations || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Messages could not be loaded");
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadConversations);
  }, [loadConversations, roommateBadges.unreadMessages]);

  const visibleConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return conversations.filter((person) =>
      !keyword || person.name?.toLowerCase().includes(keyword) || person.lastMessage?.toLowerCase().includes(keyword)
    );
  }, [conversations, search]);
  const activePerson = conversations.find((person) => person.id === activeId) || null;

  const deleteConversation = async (event, person) => {
    event.stopPropagation();
    if (!await confirmAction(`Delete your conversation with ${person.name}?`, { confirmText: "Delete" })) return;
    try {
      await api.delete(`/roommates/conversations/${person.id}`);
      setConversations((current) => current.filter((item) => item.id !== person.id));
      if (activeId === person.id) setActiveId("");
      toast.success("Conversation deleted");
      await loadConversations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Conversation could not be deleted");
    }
  };

  return (
    <main className="roommate-messages-page">
      <RoommateSubnav active="messages" />
      <section className={`roommate-messages-layout${activePerson ? " is-chat-open" : ""}`}>
        <aside className="roommate-messages-list">
          <header className="roommate-messages-list-heading">
            <div><p className="roommate-hub-eyebrow">Roommate Finder</p><h1>Messages</h1></div>
            <span>{conversations.length}</span>
          </header>
          <label className="roommate-message-search">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" />
          </label>
          <div className="roommate-conversation-list" aria-live="polite">
            {loading ? (
              <div className="roommate-hub-skeletons">
                {[1, 2, 3, 4].map((item) => (
                  <div className="roommate-hub-skeleton" key={item}>
                    <Skeleton circle width={42} height={42} />
                    <span><Skeleton width="8rem" /><Skeleton width="12rem" height={12} /></span>
                  </div>
                ))}
              </div>
            ) : visibleConversations.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title={search ? "No conversations found" : "No messages yet"}
                description={search ? "Try another name or message." : "Chat opens here after a roommate request is accepted."}
                className="roommate-hub-empty"
              />
            ) : visibleConversations.map((person) => (
              <div
                className={`roommate-conversation-row${activeId === person.id ? " is-active" : ""}`}
                key={person.id}
                onClick={() => setActiveId(person.id)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveId(person.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={activeId === person.id}
              >
                {person.avatar
                  ? <img src={person.avatar} alt="" loading="lazy" />
                  : <span className="roommate-hub-avatar">{person.name?.charAt(0)?.toUpperCase() || "R"}</span>}
                <span className="roommate-conversation-copy">
                  <strong>{person.name}</strong>
                  <small>{person.lastMessage || "Start a conversation"}</small>
                </span>
                <span className="roommate-conversation-meta">
                  <time>{relativeTime(person.lastMessageAt)}</time>
                  {person.unreadCount > 0 && <b>{person.unreadCount > 99 ? "99+" : person.unreadCount}</b>}
                  <button type="button" className="roommate-conversation-delete" onClick={(event) => deleteConversation(event, person)} title="Delete conversation" aria-label={`Delete conversation with ${person.name}`}><Trash2 size={15} /></button>
                </span>
              </div>
            ))}
          </div>
        </aside>
        <div className="roommate-messages-chat">
          {activePerson ? (
            <RoommateChat person={activePerson} currentUserId={currentUserId} onClose={() => setActiveId("")} compact />
          ) : (
            <EmptyState
              icon={MessageCircle}
              title="Your messages"
              description="Choose a conversation to continue chatting."
              className="roommate-chat-placeholder"
            />
          )}
        </div>
      </section>
    </main>
  );
}

export default RoommateMessages;
