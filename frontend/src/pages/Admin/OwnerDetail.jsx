import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Home, DoorOpen, Building2 } from "lucide-react";
import api from "../../api/axios";
import "../../styles/admin/theme.css";

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
        toast.error(error.response?.data?.message || "Failed to load owner");
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
      <div className="admin-page">
        <p style={{ color: "var(--admin-muted)" }}>Loading owner details...</p>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="admin-page">
        <p style={{ color: "var(--admin-muted)" }}>Owner not found.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>{owner.name}</h1>
          <p>{owner.phone}</p>
        </div>
        <button className="admin-btn secondary" onClick={() => navigate("/admin/owners")}>
          <ArrowLeft size={16} /> Back to Owners
        </button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total Rooms</span>
            <div className="admin-stat-icon admin-badge green">
              <Home size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{totalRooms}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Vacant</span>
            <div className="admin-stat-icon admin-badge amber">
              <DoorOpen size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{vacantRooms}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Occupied</span>
            <div className="admin-stat-icon admin-badge blue">
              <Building2 size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{occupiedRooms}</div>
        </div>
      </div>

      <div className="admin-table-wrap">
        {rooms.length === 0 ? (
          <div className="admin-empty">
            <h3>No rooms yet</h3>
            <p>This owner hasn't added any rooms yet.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Rent (₹/mo)</th>
                <th>Status</th>
                <th>Tenant</th>
                <th>Advance</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr
                  key={room._id}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/admin/rooms/${room._id}`)}
                >
                  <td>
                    <div className="admin-row-thumb">
                      <img src={room.images?.[0] || "/placeholder-room.jpg"} alt={room.title} />
                      <div>
                        <div>{room.title || "Untitled Room"}</div>
                        {room.roomNumber && (
                          <div style={{ fontSize: 12, color: "var(--admin-muted)", fontWeight: 400 }}>
                            Room #{room.roomNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{room.price?.toLocaleString("en-IN") || 0}</td>
                  <td>
                    <span className={`admin-badge ${room.status === "occupied" ? "blue" : "green"}`}>
                      <span className="admin-badge-dot" />
                      {room.status || "vacant"}
                      {room.status === "occupied" && room.liveRentStatus ? ` · ${room.liveRentStatus}` : ""}
                    </span>
                  </td>
                  <td style={{ color: "var(--admin-muted)" }}>
                    {room.status === "occupied" ? room.currentTenant?.name || "—" : "-"}
                  </td>
                  <td style={{ color: "var(--admin-muted)" }}>
                    {room.status === "occupied"
                      ? `₹${room.currentTenant?.advanceAmount?.toLocaleString("en-IN") || 0}`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default OwnerDetail;
