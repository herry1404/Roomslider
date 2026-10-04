import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Phone, LogOut, BedDouble, KeyRound, Users, Clock, Search } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import BroadcastComposer from "../../components/notifications/BroadcastComposer";

import "../../styles/hourly-manager.css";

const STATUSES = [
  { key: "available", label: "Available" },
  { key: "occupied", label: "Occupied" },
  { key: "maintenance", label: "Maintenance" },
];

const PAGE_SIZE = 20;

function timeAgo(date) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} d ago`;
}

function HourlyManagerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [requestTab, setRequestTab] = useState("pending");

  const loadData = async () => {
    try {
      const [roomsRes, bookingsRes, notificationsRes] = await Promise.all([
        api.get("/hourly-bookings/rooms"),
        api.get("/hourly-bookings"),
        api.get("/notifications/my-notifications"),
      ]);
      setRooms(roomsRes.data);
      setBookings(bookingsRes.data);
      setNotifications(notificationsRes.data.notifications || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Data load nahi hua");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user || user.role !== "hourlyManager") {
    return <Navigate to="/hourly-manager/login" replace />;
  }

  const changeRoomStatus = async (roomId, availabilityStatus) => {
    try {
      await api.patch(`/hourly-bookings/rooms/${roomId}/status`, {
        availabilityStatus,
      });
      setRooms((prev) =>
        prev.map((r) => (r._id === roomId ? { ...r, availabilityStatus } : r))
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Update fail");
    }
  };

  const changeBookingStatus = async (bookingId, status) => {
    try {
      const endpoint =
        status === "completed"
          ? `/hourly-bookings/${bookingId}/complete`
          : `/hourly-bookings/${bookingId}/cancel`;
      await api.patch(endpoint);
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status } : b))
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Update fail");
    }
  };

  const openNotification = async (notification) => {
    if (!notification.read) {
      try {
        await api.put(`/notifications/${notification._id}/read`);
        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id ? { ...item, read: true } : item
          )
        );
      } catch (error) {
        toast.error(error.response?.data?.message || "Notification update nahi hui");
      }
    }
    if (notification.actionUrl) navigate(notification.actionUrl);
  };

  const handleLogout = () => {
    logout();
    navigate("/hourly-manager/login");
  };

  const countByStatus = (s) =>
    rooms.filter((r) => r.availabilityStatus === s).length;

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchesStatus =
        statusFilter === "all" || r.availabilityStatus === statusFilter;
      const matchesSearch =
        !search.trim() ||
        r.title?.toLowerCase().includes(search.trim().toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [rooms, statusFilter, search]);

  const visibleRooms = filteredRooms.slice(0, visibleCount);

  const pendingBookings = bookings.filter((b) => b.status === "confirmed");
  const historyBookings = bookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled"
  );
  const shownBookings = requestTab === "pending" ? pendingBookings : historyBookings;

  return (
    <div className="hm-page">
      <header className="hm-header">
        <div>
          <p className="hm-muted">Hourly Room Manager</p>
          <h1>Hi, {user.name}</h1>
        </div>
        <div className="hm-search">
          <Search size={16} />
          <input
            placeholder="Search room number or title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          />
        </div>
        <button className="hm-logout" onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </header>

      <section className="hm-stats">
        <div className="hm-stat">
          <BedDouble size={20} />
          <span>Total Rooms</span>
          <strong>{rooms.length}</strong>
        </div>
        <div className="hm-stat">
          <KeyRound size={20} />
          <span>Available</span>
          <strong>{countByStatus("available")}</strong>
        </div>
        <div className="hm-stat">
          <Users size={20} />
          <span>Occupied</span>
          <strong>{countByStatus("occupied")}</strong>
        </div>
        <div className="hm-stat">
          <Clock size={20} />
          <span>Pending</span>
          <strong>{pendingBookings.length}</strong>
        </div>
      </section>

      <BroadcastComposer />

      <div className="hm-main">
      <h2 className="hm-title">Notifications</h2>
      {notifications.length === 0 ? (
        <p className="hm-muted">Abhi koi notification nahi hai</p>
      ) : (
        <section className="hm-notifications">
          {notifications.map((notification) => (
            <button
              className={`hm-notification${notification.read ? "" : " unread"}`}
              key={notification._id}
              onClick={() => openNotification(notification)}
            >
              <strong>{notification.title}</strong>
              <span>{notification.message}</span>
              <small>{timeAgo(notification.createdAt)}</small>
            </button>
          ))}
        </section>
      )}

      <h2 className="hm-title">Rooms</h2>

      <div className="hm-filters">
        {[
          { key: "all", label: "All", count: rooms.length },
          { key: "available", label: "Available", count: countByStatus("available") },
          { key: "occupied", label: "Occupied", count: countByStatus("occupied") },
          { key: "maintenance", label: "Maintenance", count: countByStatus("maintenance") },
        ].map((f) => (
          <button
            key={f.key}
            className={statusFilter === f.key ? "active" : ""}
            onClick={() => {
              setStatusFilter(f.key);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            {f.label} <span className="hm-filter-count">{f.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="hm-muted">Loading...</p>
      ) : filteredRooms.length === 0 ? (
        <p className="hm-muted">Koi room nahi mila</p>
      ) : (
        <>
          <section className="hm-rooms">
            {visibleRooms.map((room) => (
              <div className="hm-room" key={room._id}>
                <div className="hm-room-top">
                  <img src={room.images?.[0]} alt={room.title} />
                  <div>
                    <h3>{room.title}</h3>
                    <p className="hm-muted">₹{room.pricePerHour}/hr</p>
                  </div>
                </div>
                <div className="hm-toggle">
                  {STATUSES.map((s) => (
                    <button
                      key={s.key}
                      className={
                        room.availabilityStatus === s.key
                          ? `active ${s.key}`
                          : ""
                      }
                      onClick={() => changeRoomStatus(room._id, s.key)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <p className="hm-muted hm-showing">
            Showing {visibleRooms.length} of {filteredRooms.length} rooms
          </p>

          {visibleCount < filteredRooms.length && (
            <button
              className="hm-load-more"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            >
              Load More
            </button>
          )}
        </>
      )}

      <h2 className="hm-title">Booking Requests</h2>

      <div className="hm-req-tabs">
        <button
          className={requestTab === "pending" ? "active" : ""}
          onClick={() => setRequestTab("pending")}
        >
          Pending <span className="hm-filter-count">{pendingBookings.length}</span>
        </button>
        <button
          className={requestTab === "history" ? "active" : ""}
          onClick={() => setRequestTab("history")}
        >
          History
        </button>
      </div>

      {shownBookings.length === 0 ? (
        <p className="hm-muted">
          {requestTab === "pending" ? "Abhi koi request nahi" : "Koi history nahi"}
        </p>
      ) : (
        <section className="hm-requests">
          {shownBookings.map((b) => (
            <div className="hm-request" key={b._id}>
              <div className="hm-avatar">
                {b.guestName?.slice(0, 2).toUpperCase()}
              </div>
              <div className="hm-request-info">
                <h4>{b.guestName}</h4>
                <p className="hm-muted">
                  {b.guestPhone} · {b.room?.title}
                </p>
                <p className="hm-muted">{timeAgo(b.createdAt)}</p>
                <div className="hm-actions">
                  <span className={`hm-chip ${b.status}`}>{b.status}</span>
                  {b.status === "confirmed" && (
                    <button onClick={() => changeBookingStatus(b._id, "completed")}>
                      Complete
                    </button>
                  )}
                </div>
              </div>
              <a className="hm-call" href={`tel:${b.guestPhone}`}>
                <Phone size={18} />
              </a>
            </div>
          ))}
        </section>
      )}
      </div>
    </div>
  );
}

export default HourlyManagerDashboard;
