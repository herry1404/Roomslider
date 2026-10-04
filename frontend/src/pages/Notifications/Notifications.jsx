import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell, CheckCheck, CreditCard, MessageCircle, Package, Trash2, Users,
} from "lucide-react";

import { useNotifications } from "../../context/useNotifications";
import EnablePushButton from "../../components/notifications/EnablePushButton";
import "../../styles/notifications.css";

const FILTERS = ["All", "Unread", "Requests", "Messages", "Payments"];
const REQUEST_TYPES = new Set([
  "roommate_request", "roommate_accepted", "service_request", "service_status",
  "furniture_status", "vehicle_status", "vacate_notice", "loan_status", "maintenance",
]);

const relativeTime = (value) => {
  if (!value) return "";
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const iconFor = (type) => {
  if (type === "payment") return CreditCard;
  if (type === "roommate_message") return MessageCircle;
  if (type.startsWith("roommate")) return Users;
  if (type.includes("request") || type.includes("status") || type === "maintenance") return Package;
  return Bell;
};

function Notifications() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const {
    notifications, unreadCount, initialLoading, hasMore, loadMore,
    markRead, markAllRead, deleteNotification,
  } = useNotifications();

  const filtered = useMemo(() => notifications.filter((item) => {
    if (filter === "Unread") return !item.isRead;
    if (filter === "Requests") return REQUEST_TYPES.has(item.type);
    if (filter === "Messages") return item.type === "roommate_message";
    if (filter === "Payments") return item.type === "payment";
    return true;
  }), [filter, notifications]);

  const openNotification = (item) => {
    markRead(item);
    if (item.link) navigate(item.link);
  };

  return (
    <section className="notifications-page">
      <header className="notifications-page-header">
        <div>
          <p className="notifications-eyebrow">Your activity</p>
          <h1>Notifications</h1>
          <p className="notifications-subtitle">Updates about your requests, messages and payments.</p>
        </div>
        <EnablePushButton className="notifications-push-button">
          <Bell size={17} />
          Enable browser alerts
        </EnablePushButton>
      </header>

      <div className="notifications-toolbar">
        <div className="notifications-filters" role="tablist" aria-label="Notification filters">
          {FILTERS.map((name) => (
            <button
              className={filter === name ? "notifications-filter is-active" : "notifications-filter"}
              key={name}
              type="button"
              role="tab"
              aria-selected={filter === name}
              onClick={() => setFilter(name)}
            >
              {name}{name === "Unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </button>
          ))}
        </div>
        <button
          className="notifications-mark-all"
          type="button"
          onClick={markAllRead}
          disabled={!unreadCount}
        >
          <CheckCheck size={16} /> Mark all as read
        </button>
      </div>

      <div className="notifications-list" aria-live="polite">
        {initialLoading && notifications.length === 0 && (
          <div className="notifications-skeletons" aria-label="Loading notifications">
            {[1, 2, 3, 4].map((item) => <div className="notifications-skeleton" key={item} />)}
          </div>
        )}
        {!initialLoading && filtered.length === 0 && (
          <div className="notifications-empty">
            <span className="notifications-empty-icon"><Bell size={24} /></span>
            <h2>{filter === "All" ? "You’re all caught up" : `No ${filter.toLowerCase()} notifications`}</h2>
            <p>New updates will show up here.</p>
            {filter !== "All" && <button type="button" onClick={() => setFilter("All")}>Show all notifications</button>}
          </div>
        )}
        {filtered.map((item) => {
          const Icon = iconFor(item.type);
          return (
            <article
              className={`notifications-item${item.isRead ? "" : " is-unread"}`}
              key={item._id}
              onClick={() => openNotification(item)}
            >
              <span className="notifications-item-icon"><Icon size={19} /></span>
              <div className="notifications-item-content">
                <div className="notifications-item-heading">
                  <h2>{item.title}</h2>
                  {!item.isRead && <span className="notifications-unread-dot" aria-label="Unread" />}
                </div>
                {item.body && <p>{item.body}</p>}
                <time dateTime={item.createdAt}>{relativeTime(item.createdAt)}</time>
              </div>
              <div className="notifications-item-actions">
                {!item.isRead && (
                  <button
                    type="button"
                    aria-label="Mark as read"
                    title="Mark as read"
                    onClick={(event) => { event.stopPropagation(); markRead(item); }}
                  >
                    <CheckCheck size={17} />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Delete notification"
                  title="Delete notification"
                  onClick={(event) => { event.stopPropagation(); deleteNotification(item._id); }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {hasMore && (
        <button className="notifications-load-more" type="button" onClick={loadMore}>
          Load more
        </button>
      )}
      <Link className="notifications-profile-link" to="/profile?tab=notifications">View in profile</Link>
    </section>
  );
}

export default Notifications;
