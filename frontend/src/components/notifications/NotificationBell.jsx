import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, CreditCard, HeartPulse, MessageCircle, Package, Users } from "lucide-react";

import { useNotifications } from "../../context/useNotifications";
import roommateNotificationLink from "../../utils/roommateNotificationLink";

const relativeTime = (value) => {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const iconFor = (type) => {
  if (type === "payment") return CreditCard;
  if (type === "blood_request") return HeartPulse;
  if (type === "roommate_message") return MessageCircle;
  if (type.startsWith("roommate")) return Users;
  if (type.includes("request") || type.includes("status") || type === "maintenance") return Package;
  return Bell;
};

function NotificationBell({ mobile = false }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const latest = notifications.slice(0, 8);

  const openCenter = () => {
    setOpen(false);
    navigate("/notifications");
  };

  const openItem = (item) => {
    setOpen(false);
    markRead(item);
    navigate(roommateNotificationLink(item) || "/notifications");
  };

  return (
    <div className={`notification-bell${mobile ? " notification-bell--mobile" : ""}`}>
      <button
        type="button"
        className="navbar-notification-btn"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={!mobile && open}
        title="Notifications"
        onClick={() => mobile ? navigate("/notifications") : setOpen((value) => !value)}
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="notification-bell-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>
      {!mobile && open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <div>
              <strong>Notifications</strong>
              {unreadCount > 0 && <span>{unreadCount} unread</span>}
            </div>
            <button type="button" onClick={markAllRead} disabled={!unreadCount}>
              <CheckCheck size={15} /> Mark all as read
            </button>
          </div>
          <div className="notification-dropdown-list">
            {latest.length === 0 && <p className="notification-dropdown-empty">You’re all caught up.</p>}
            {latest.map((item) => {
              const Icon = iconFor(item.type);
              return (
                <button
                  className={`notification-dropdown-item${item.isRead ? "" : " is-unread"}`}
                  key={item._id}
                  type="button"
                  onClick={() => openItem(item)}
                >
                  <span className="notification-dropdown-icon"><Icon size={17} /></span>
                  <span className="notification-dropdown-copy">
                    <strong>{item.title}</strong>
                    {item.body && <span>{item.body}</span>}
                    <time>{relativeTime(item.createdAt)}</time>
                  </span>
                  {!item.isRead && <span className="notification-unread-dot" />}
                </button>
              );
            })}
          </div>
          <button className="notification-dropdown-all" type="button" onClick={openCenter}>See all notifications</button>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
