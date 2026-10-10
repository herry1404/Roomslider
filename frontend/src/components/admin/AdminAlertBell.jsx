import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const SOUND_KEY = "admin-alert-sound-enabled";

function playAlertBeep() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
    oscillator.onended = () => context.close();
  } catch {
    // Audio may be unavailable until the user interacts with the page.
  }
}

function AdminAlertBell() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem(SOUND_KEY) !== "false"
  );
  const previousCount = useRef(null);

  const refreshAlerts = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/alerts");
      const nextCount = Number(data.unreadCount) || 0;
      if (previousCount.current !== null && nextCount > previousCount.current && soundEnabled) {
        playAlertBeep();
      }
      previousCount.current = nextCount;
      setUnreadCount(nextCount);
      setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
    } catch (error) {
      console.error("Admin alerts refresh failed:", error.message);
    }
  }, [soundEnabled]);

  useEffect(() => {
    let intervalId;
    const updatePolling = () => {
      window.clearInterval(intervalId);
      intervalId = undefined;
      if (document.visibilityState === "visible") {
        refreshAlerts();
        intervalId = window.setInterval(refreshAlerts, 15000);
      }
    };
    document.addEventListener("visibilitychange", updatePolling);
    updatePolling();
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", updatePolling);
    };
  }, [refreshAlerts]);

  const toggleSound = () => {
    const nextValue = !soundEnabled;
    setSoundEnabled(nextValue);
    localStorage.setItem(SOUND_KEY, String(nextValue));
  };

  const openAlert = async (alert) => {
    try {
      await api.patch(`/admin/alerts/${alert._id}/read`);
    } catch (error) {
      console.error("Admin alert read update failed:", error.message);
    }
    setAlerts((current) => current.map((item) =>
      item._id === alert._id ? { ...item, isRead: true } : item
    ));
    setUnreadCount((count) => Math.max(0, count - (alert.isRead ? 0 : 1)));
    setOpen(false);
    navigate(alert.link);
  };

  const markAllRead = async () => {
    try {
      await api.patch("/admin/alerts/read-all");
      setAlerts((current) => current.map((alert) => ({ ...alert, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Admin alerts read update failed:", error.message);
    }
  };

  return (
    <div className="admin-alert-menu">
      <button
        className="notification-btn"
        type="button"
        aria-label={`${unreadCount} unread admin alerts`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="admin-alert-count">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>
      {open && (
        <div className="admin-alert-dropdown">
          <div className="admin-alert-heading">
            <strong>Admin alerts</strong>
            <button type="button" className="admin-alert-sound" onClick={toggleSound}>
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              Sound {soundEnabled ? "on" : "off"}
            </button>
          </div>
          {alerts.length > 0 ? (
            <>
              <div className="admin-alert-list">
                {alerts.map((alert) => (
                  <button
                    type="button"
                    className={`admin-alert-item${alert.isRead ? "" : " unread"}`}
                    key={alert._id}
                    onClick={() => openAlert(alert)}
                  >
                    <strong>{alert.title}</strong>
                    <span>{alert.message}</span>
                    {alert.details && (
                      <span className="admin-alert-details">
                        {alert.details.visitorName && <span>Visitor: {alert.details.visitorName}</span>}
                        {alert.details.visitorPhone && <span>Phone: {alert.details.visitorPhone}</span>}
                        {alert.details.visitorEmail && <span>Email: {alert.details.visitorEmail}</span>}
                        {alert.details.action && (
                          <span>
                            Contact method: {{
                              call: "Phone call",
                              whatsapp: "WhatsApp",
                              chat: "Chat",
                            }[alert.details.action] || alert.details.action}
                          </span>
                        )}
                        {alert.details.listingTitle && <span>Listing: {alert.details.listingTitle}</span>}
                        {alert.details.listingCategory && <span>Type: {alert.details.listingCategory}</span>}
                        {alert.details.listingLocation && <span>Location: {alert.details.listingLocation}</span>}
                        {alert.details.ownerName && <span>Owner: {alert.details.ownerName}</span>}
                      </span>
                    )}
                    <time>{new Date(alert.createdAt).toLocaleString()}</time>
                  </button>
                ))}
              </div>
              {unreadCount > 0 && (
                <button className="admin-alert-mark-all" type="button" onClick={markAllRead}>
                  Mark all as read
                </button>
              )}
            </>
          ) : (
            <p className="admin-alert-empty">No alerts yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminAlertBell;
