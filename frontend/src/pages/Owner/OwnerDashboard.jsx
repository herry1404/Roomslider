import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { Home, DoorOpen, DoorClosed, Zap, Wallet, Bell } from "lucide-react";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

import "../../styles/owner/dashboard.css";

function OwnerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [owner, setOwner] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyRooms = async () => {
      try {
        const res = await api.get("/owners/me");
        setOwner(res.data.owner);
        setRooms(res.data.rooms || []);
      } catch (error) {
        console.error("OWNER DASHBOARD ERROR:", error);
        toast.error(
          error.response?.data?.message || "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyRooms();
  }, []);

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const vacantRooms = totalRooms - occupiedRooms;

  if (loading) {
    return (
      <div className="owner-dashboard">
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="owner-dashboard">

      <div className="owner-dashboard-top">
        <div>
          <h2>Owner Dashboard</h2>
          <p>Welcome back, {owner?.name || user?.name} 🏠</p>
        </div>

        <div className="owner-dashboard-actions">
          <button
            className="owner-btn owner-btn-primary"
            onClick={() => navigate("/owner/rooms/add")}
          >
            <Home size={16} />
            Add Room
          </button>
          <button
            className="owner-btn owner-btn-secondary"
            onClick={() => navigate("/owner/electricity")}
          >
            <Zap size={16} />
            Update Electricity Bills
          </button>
          <button
            className="owner-btn owner-btn-secondary"
            onClick={() => navigate("/owner/expenses")}
          >
            <Wallet size={16} />
            Expenses & Profit
          </button>
          <button
            className="owner-btn owner-btn-secondary"
            onClick={() => navigate("/owner/reminders")}
          >
            <Bell size={16} />
            Reminders
          </button>
          <button
            className="owner-btn owner-btn-secondary"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="owner-stats-grid">

        <div className="owner-stat-card total">
          <div className="owner-stat-icon"><Home size={20} /></div>
          <div>
            <span>Total Rooms</span>
            <h2>{totalRooms}</h2>
          </div>
        </div>

        <div className="owner-stat-card vacant">
          <div className="owner-stat-icon"><DoorOpen size={20} /></div>
          <div>
            <span>Vacant</span>
            <h2>{vacantRooms}</h2>
          </div>
        </div>

        <div className="owner-stat-card occupied">
          <div className="owner-stat-icon"><DoorClosed size={20} /></div>
          <div>
            <span>Occupied</span>
            <h2>{occupiedRooms}</h2>
          </div>
        </div>

      </div>

      {/* Room Grid */}
      <div className="owner-rooms-section">
        <div className="owner-rooms-header">
          <h3>Your Rooms</h3>
        </div>

        {rooms.length === 0 ? (
          <div className="owner-empty-state">
            <p>You haven't added any rooms yet. Click "Add Room" to get started.</p>
          </div>
        ) : (
          <div className="owner-rooms-grid">
            {rooms.map((room) => (
              <div
                key={room._id}
                className="owner-room-card"
                onClick={() => navigate(`/owner/rooms/${room._id}`)}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={room.images?.[0] || "/placeholder-room.jpg"}
                  alt={room.title || "Room"}
                  className="owner-room-image"
                />
                <div className="owner-room-body">
                  <div className="owner-room-top-row">
                    <div>
                      <div className="owner-room-title">
                        {room.title || "Untitled Room"}
                      </div>
                      {room.roomNumber && (
                        <div className="owner-room-number">
                          Room #{room.roomNumber}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span
                        className={`owner-status-badge ${room.status || "vacant"}`}
                      >
                        {room.status || "vacant"}
                      </span>
                      {room.status === "occupied" && room.liveRentStatus && (
                        <div>
                          <span className={`owner-rent-badge ${room.liveRentStatus}`}>
                            Rent: {room.liveRentStatus}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="owner-room-price">
                    ₹{room.price?.toLocaleString("en-IN") || 0}
                    <span> /month</span>
                  </div>

                  {room.status === "occupied" && (
                    <div className="owner-advance-tag">
                      Advance: <strong>₹{room.currentTenant?.advanceAmount?.toLocaleString("en-IN") || 0}</strong>
                    </div>
                  )}

                  {room.currentTenant?.vacateNoticeDate && (
                    <div style={{ marginTop: 6, fontSize: 12.5, color: "#b91c1c", fontWeight: 600 }}>
                      Notice: vacating {new Date(room.currentTenant.vacateNoticeDate).toLocaleDateString("en-IN")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default OwnerDashboard;
