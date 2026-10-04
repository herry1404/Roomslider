import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/axios";
import { useAuth } from "./AuthContext";
import NotificationContext from "./notificationContext";

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const identity = user ? `${user.id || user._id}:${user.role || "user"}` : "";
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [roommateBadges, setRoommateBadges] = useState({ pendingRequests: 0, unreadMessages: 0 });
  const seenIds = useRef(new Set());
  const streamConnected = useRef(false);

  const loadLatest = useCallback(async () => {
    if (!identity) return;
    setInitialLoading(true);
    try {
      const [listResponse, countResponse] = await Promise.all([
        api.get("/notifications", { params: { limit: 8 } }),
        api.get("/notifications/unread-count"),
      ]);
      const rows = listResponse.data.notifications || [];
      seenIds.current = new Set(rows.map((item) => String(item._id)));
      setNotifications(rows);
      setUnreadCount(Number(countResponse.data.count) || 0);
      setNextCursor(listResponse.data.nextCursor || null);
      setHasMore(Boolean(listResponse.data.hasMore));
    } catch (error) {
      console.error("NOTIFICATION LOAD ERROR:", error);
      toast.error("Notifications could not be loaded");
    } finally {
      setInitialLoading(false);
    }
  }, [identity]);

  const refreshRoommateBadges = useCallback(async () => {
    if (!identity || user?.role && user.role !== "user") return;
    try {
      const response = await api.get("/roommates/badges");
      setRoommateBadges({
        pendingRequests: Number(response.data.pendingRequests) || 0,
        unreadMessages: Number(response.data.unreadMessages) || 0,
      });
    } catch (error) {
      console.error("ROOMMATE BADGE REFRESH ERROR:", error);
    }
  }, [identity, user]);

  const loadMore = useCallback(async () => {
    if (!identity || !hasMore || !nextCursor) return;
    try {
      const response = await api.get("/notifications", {
        params: { limit: 20, cursor: nextCursor },
      });
      const rows = response.data.notifications || [];
      rows.forEach((item) => seenIds.current.add(String(item._id)));
      setNotifications((current) => {
        const existing = new Set(current.map((item) => String(item._id)));
        return [...current, ...rows.filter((item) => !existing.has(String(item._id)))];
      });
      setNextCursor(response.data.nextCursor || null);
      setHasMore(Boolean(response.data.hasMore));
    } catch (error) {
      console.error("NOTIFICATION PAGE LOAD ERROR:", error);
      toast.error("Could not load more notifications");
    }
  }, [hasMore, identity, nextCursor]);

  const markRead = useCallback(async (notification) => {
    if (!notification || notification.isRead) return;
    try {
      await api.put(`/notifications/${notification._id}/read`);
      setNotifications((current) => current.map((item) =>
        item._id === notification._id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
      ));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error("MARK NOTIFICATION READ ERROR:", error);
      toast.error("Could not mark notification as read");
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("MARK ALL NOTIFICATIONS READ ERROR:", error);
      toast.error("Could not mark notifications as read");
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    const item = notifications.find((notification) => notification._id === notificationId);
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((current) => current.filter((notification) => notification._id !== notificationId));
      if (item && !item.isRead) setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error("DELETE NOTIFICATION ERROR:", error);
      toast.error("Could not delete notification");
    }
  }, [notifications]);

  useEffect(() => {
    if (!identity) {
      return undefined;
    }

    let active = true;
    let source;
    let reconnectTimer;
    let reconnectDelay = 1000;
    streamConnected.current = false;
    Promise.resolve().then(() => {
      if (active) {
        loadLatest();
        refreshRoommateBadges();
      }
    });

    const connect = async () => {
      try {
        const tokenResponse = await api.get("/notifications/stream-token");
        if (!active) return;
        const baseUrl = (api.defaults.baseURL || "/api").replace(/\/$/, "");
        source = new EventSource(`${baseUrl}/notifications/stream?token=${encodeURIComponent(tokenResponse.data.token)}`);
        source.onopen = () => {
          streamConnected.current = true;
          reconnectDelay = 1000;
        };
        source.addEventListener("notification", (event) => {
          try {
            const item = JSON.parse(event.data);
            const isNew = !seenIds.current.has(String(item._id));
            seenIds.current.add(String(item._id));
            setNotifications((current) => [
              item,
              ...current.filter((existing) => existing._id !== item._id),
            ].slice(0, 200));
            if (isNew && !item.isRead) setUnreadCount((count) => count + 1);
            if (item.type?.startsWith("roommate_")) refreshRoommateBadges();
            if (isNew) toast(item.title || "New notification", { icon: "🔔" });
          } catch (error) {
            console.error("INVALID NOTIFICATION STREAM EVENT:", error);
          }
        });
        source.onerror = () => {
          streamConnected.current = false;
          source?.close();
          if (active && !reconnectTimer) {
            reconnectTimer = window.setTimeout(() => {
              reconnectTimer = null;
              reconnectDelay = Math.min(reconnectDelay * 2, 30000);
              connect();
            }, reconnectDelay);
          }
        };
      } catch (error) {
        if (!active) return;
        console.error("NOTIFICATION STREAM CONNECT ERROR:", error);
        if (!reconnectTimer) {
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null;
            reconnectDelay = Math.min(reconnectDelay * 2, 30000);
            connect();
          }, reconnectDelay);
        }
      }
    };

    connect();
    const poll = window.setInterval(async () => {
      refreshRoommateBadges();
      if (streamConnected.current) return;
      try {
        const response = await api.get("/notifications/unread-count");
        if (active) setUnreadCount(Number(response.data.count) || 0);
      } catch (error) {
        console.error("NOTIFICATION POLL ERROR:", error);
      }
    }, 30000);

    return () => {
      active = false;
      streamConnected.current = false;
      source?.close();
      window.clearInterval(poll);
      window.clearTimeout(reconnectTimer);
    };
  }, [identity, loadLatest, refreshRoommateBadges]);

  useEffect(() => {
    if (identity) return undefined;
    const reset = window.setTimeout(() => {
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
      setNextCursor(null);
      setRoommateBadges({ pendingRequests: 0, unreadMessages: 0 });
      seenIds.current.clear();
    }, 0);
    return () => window.clearTimeout(reset);
  }, [identity]);

  return (
    <NotificationContext.Provider
      value={{
        notifications: identity ? notifications : [],
        unreadCount: identity ? unreadCount : 0,
        initialLoading: Boolean(identity && initialLoading),
        hasMore: Boolean(identity && hasMore),
        roommateBadges: identity ? roommateBadges : { pendingRequests: 0, unreadMessages: 0 },
        refreshRoommateBadges,
        loadMore,
        loadLatest,
        markRead,
        markAllRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
