import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Pencil,
  Trash2,
  Search,
  Plus,
  Home,
  CheckCircle2,
  DoorOpen,
  Clock,
} from "lucide-react";

import toast from "react-hot-toast";
import api from "../../api/axios";

import "../../styles/admin/theme.css";

function ManageRooms() {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [owners, setOwners] = useState([]);

  const fetchRooms = async () => {
    try {
      const res = await api.get("/rooms?includeOccupied=true");
      const data = res.data.rooms || [];
      setRooms(data);
      setFilteredRooms(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    api
      .get("/owners")
      .then((res) => setOwners(res.data || []))
      .catch((err) => console.error("Failed to load owners:", err));
  }, []);

  const uniqueCities = [...new Set(rooms.map((room) => room.location).filter(Boolean))];

  useEffect(() => {
    const keyword = search.toLowerCase();

    const filtered = rooms.filter((room) => {
      const matchesSearch =
        room.title?.toLowerCase().includes(keyword) ||
        room.location?.toLowerCase().includes(keyword) ||
        room.category?.toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "all" || room.status === statusFilter;
      const matchesOwner = ownerFilter === "all" || room.owner?._id === ownerFilter;
      const matchesCity = cityFilter === "all" || room.location === cityFilter;

      return matchesSearch && matchesStatus && matchesOwner && matchesCity;
    });

    setFilteredRooms(filtered);
  }, [search, rooms, statusFilter, ownerFilter, cityFilter]);

  const deleteRoom = async (id) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;

    try {
      await api.delete(`/rooms/${id}`);
      toast.success("Room deleted successfully");
      const updated = rooms.filter((room) => room._id !== id);
      setRooms(updated);
      setFilteredRooms(updated);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete room");
    }
  };

  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter((r) => r.status === "occupied").length;
  const vacantCount = rooms.filter((r) => r.status === "vacant").length;
  const occupancyPct = totalRooms ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  if (loading) {
    return (
      <div className="admin-page">
        <p style={{ color: "var(--admin-muted)" }}>Loading rooms...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Manage Rooms</h1>
          <p>Monitor, review, and organize property room listings.</p>
        </div>
        <Link to="/admin/rooms/add" className="admin-btn">
          <Plus size={18} />
          Add Room
        </Link>
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
            <span className="admin-stat-label">Occupied</span>
            <div className="admin-stat-icon admin-badge green">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{occupiedCount}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Vacant</span>
            <div className="admin-stat-icon admin-badge amber">
              <DoorOpen size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{vacantCount}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Occupancy</span>
            <div className="admin-stat-icon admin-badge blue">
              <Clock size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{occupancyPct}%</div>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by title, location or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="vacant">Vacant</option>
          <option value="occupied">Occupied</option>
        </select>

        <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
          <option value="all">All Owners</option>
          {owners.map((owner) => (
            <option key={owner._id} value={owner._id}>
              {owner.name}
            </option>
          ))}
        </select>

        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
          <option value="all">All Cities</option>
          {uniqueCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-table-wrap">
        {filteredRooms.length === 0 ? (
          <div className="admin-empty">
            <h3>No rooms found</h3>
            <p>Try updating your search or filters.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Location</th>
                <th>Rent (₹/mo)</th>
                <th>Category</th>
                <th>Status</th>
                <th>Owner</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((room) => (
                <tr key={room._id}>
                  <td>
                    <div className="admin-row-thumb">
                      <img src={room.images?.[0]} alt={room.title} />
                      <span>{room.title}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--admin-muted)" }}>{room.location}</td>
                  <td style={{ fontWeight: 700 }}>
                    ₹{Number(room.price || 0).toLocaleString("en-IN")}
                  </td>
                  <td style={{ color: "var(--admin-muted)" }}>{room.category}</td>
                  <td>
                    <span className={`admin-badge ${room.status === "occupied" ? "blue" : "green"}`}>
                      <span className="admin-badge-dot" />
                      {room.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--admin-muted)" }}>
                    {room.owner?.name || "Unassigned"}
                  </td>
                  <td>
                    <div className="admin-row-actions" style={{ justifyContent: "flex-end" }}>
                      <Link
                        to={`/admin/rooms/edit/${room._id}`}
                        className="admin-icon-btn accent"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        className="admin-icon-btn danger"
                        title="Delete"
                        onClick={() => deleteRoom(room._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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

export default ManageRooms;
