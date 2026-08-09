import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../api/axios";

import "../../styles/owner/dashboard.css";

function OwnerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [owner, setOwner] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOwner = async () => {
      try {
        const res = await api.get(`/owners/${id}`);
        setOwner(res.data.owner);
        setRooms(res.data.rooms || []);
      } catch (error) {
        console.error("OWNER DETAIL ERROR:", error);
        toast.error(
          error.response?.data?.message || "Failed to load owner"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOwner();
  }, [id]);

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const vacantRooms = totalRooms - occupiedRooms;

  if (loading) {
    return (
      <div className="owner-dashboard">
        <p>Loading owner details...</p>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="owner-dashboard">
        <p>Owner not found.</p>
      </div>
    );
  }

  return (
    <div className="owner-dashboard">

      <div className="owner-dashboard-top">
        <div>
          <h2>{owner.name}</h2>
          <p>{owner.email} {owner.phone ? `• ${owner.phone}` : ""}</p>
        </div>

        <div className="owner-dashboard-actions">
          <button
            className="owner-btn owner-btn-secondary"
            onClick={() => navigate("/admin/owners")}
          >
            Back to Owners
          </button>
        </div>
      </div>

      <div className="owner-stats-grid">
        <div className="owner-stat-card total">
          <span>Total Rooms</span>
          <h2>{totalRooms}</h2>
        </div>

        <div className="owner-stat-card vacant">
          <span>Vacant</span>
          <h2>{vacantRooms}</h2>
        </div>

        <div className="owner-stat-card occupied">
          <span>Occupied</span>
          <h2>{occupiedRooms}</h2>
        </div>
      </div>

      <div className="owner-rooms-section">
        <div className="owner-rooms-header">
          <h3>Rooms</h3>
        </div>

        {rooms.length === 0 ? (
          <div className="owner-empty-state">
            <p>This owner hasn't added any rooms yet.</p>
          </div>
        ) : (
          <div className="owner-rooms-grid">
            {rooms.map((room) => (
              <div
                key={room._id}
                className="owner-room-card"
                onClick={() => navigate(`/admin/rooms/${room._id}`)}
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
                    <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>
                      <div>
                        Tenant: <strong>{room.currentTenant?.name || "—"}</strong>
                      </div>
                      <div style={{ color: "#6b7280" }}>
                        {room.currentTenant?.phone || "No phone on file"}
                      </div>
                      <div className="owner-advance-tag">
                        Advance: <strong>₹{room.currentTenant?.advanceAmount?.toLocaleString("en-IN") || 0}</strong>
                      </div>
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

export default OwnerDetail;
