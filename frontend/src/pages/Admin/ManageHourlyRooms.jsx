import { useEffect, useState } from "react";
import { DoorOpen, MapPin, Trash2, Plus, X, Pencil, Check, Ban } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/admin/theme.css";

function ManageHourlyRooms() {
  const [rooms, setRooms] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [images, setImages] = useState([]);

  const [form, setForm] = useState({
    ownerId: "",
    title: "",
    description: "",
    address: "",
    city: "",
    pricePerHour: "",
    amenities: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, ownersRes] = await Promise.all([
        api.get("/hourly-rooms"),
        api.get("/owners"),
      ]);
      setRooms(roomsRes.data || []);
      setOwners(ownersRes.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load hourly rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setImages([]);
    setForm({ ownerId: "", title: "", description: "", address: "", city: "", pricePerHour: "", amenities: "" });
    setShowModal(true);
  };

  const openEditModal = (room) => {
    setEditingId(room._id);
    setImages([]);
    setForm({
      ownerId: room.requestedByOwner?._id || "",
      title: room.title,
      description: room.description || "",
      address: room.location?.address || "",
      city: room.location?.city || "",
      pricePerHour: room.pricePerHour,
      amenities: (room.amenities || []).join(", "),
    });
    setShowModal(true);
  };

  const handleImageChange = (e) => setImages(Array.from(e.target.files));
  const removeImage = (index) => setImages(images.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingId && images.length === 0) {
      toast.error("Please select room images");
      return;
    }

    try {
      const data = new FormData();
      data.append("requestedByOwner", form.ownerId);
      data.append("title", form.title);
      data.append("description", form.description);
      data.append("location[address]", form.address);
      data.append("location[city]", form.city);
      data.append("pricePerHour", form.pricePerHour);
      data.append(
        "amenities",
        JSON.stringify(form.amenities ? form.amenities.split(",").map((a) => a.trim()).filter(Boolean) : [])
      );
      images.forEach((image) => data.append("images", image));

      if (editingId) {
        await api.put(`/hourly-rooms/${editingId}`, data, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Room updated");
      } else {
        await api.post("/hourly-rooms", data, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Room added");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save room");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this hourly room?")) return;
    try {
      await api.delete(`/hourly-rooms/${id}`);
      toast.success("Room deleted");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete room");
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/hourly-rooms/${id}/approve`);
      toast.success("Request approved");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve");
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Rejection reason (optional):") || "";
    try {
      await api.put(`/hourly-rooms/${id}/reject`, { reason });
      toast.success("Request rejected");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject");
    }
  };

  const pendingCount = rooms.filter((r) => r.status === "pending").length;
  const approvedCount = rooms.filter((r) => r.status === "approved").length;

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
          <h1>Hourly Rooms</h1>
          <p>Ghante ke hisaab se book hone wale rooms manage karo.</p>
        </div>
        <button className="admin-btn" onClick={openAddModal}>
          <Plus size={18} /> Add Room
        </button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total</span>
            <div className="admin-stat-icon admin-badge green">
              <DoorOpen size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{rooms.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Pending</span>
            <div className="admin-stat-icon admin-badge amber">
              <DoorOpen size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{pendingCount}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Approved</span>
            <div className="admin-stat-icon admin-badge green">
              <DoorOpen size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{approvedCount}</div>
        </div>
      </div>

      <div className="admin-table-wrap">
        {rooms.length === 0 ? (
          <div className="admin-empty">
            <h3>No hourly rooms yet</h3>
            <p>Koi hourly room add nahi hua hai abhi tak.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Location</th>
                <th>Price/Hour</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div className="admin-row-thumb">
                      {r.images?.[0] ? (
                        <img src={r.images[0]} alt={r.title} />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: "var(--admin-accent-soft)",
                            color: "var(--admin-accent)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <DoorOpen size={18} />
                        </div>
                      )}
                      <div>
                        <div>{r.title}</div>
                        <div style={{ fontSize: 12, color: "var(--admin-muted)", fontWeight: 400 }}>
                          {r.requestedByOwner?.name || "Admin added"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--admin-muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <MapPin size={13} /> {r.location?.address}, {r.location?.city}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{r.pricePerHour}</td>
                  <td>
                    <span
                      className={`admin-badge ${
                        r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "amber"
                      }`}
                    >
                      <span className="admin-badge-dot" />
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions" style={{ justifyContent: "flex-end" }}>
                      {r.status === "pending" && (
                        <>
                          <button className="admin-icon-btn accent" title="Approve" onClick={() => handleApprove(r._id)}>
                            <Check size={16} />
                          </button>
                          <button className="admin-icon-btn danger" title="Reject" onClick={() => handleReject(r._id)}>
                            <Ban size={16} />
                          </button>
                        </>
                      )}
                      <button className="admin-icon-btn accent" title="Edit" onClick={() => openEditModal(r)}>
                        <Pencil size={16} />
                      </button>
                      <button className="admin-icon-btn danger" title="Delete" onClick={() => handleDelete(r._id)}>
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

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--admin-card)", border: "1px solid var(--admin-border)", borderRadius: 16, padding: 26, width: "100%", maxWidth: 440, maxHeight: "85vh", overflowY: "auto", position: "relative" }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", color: "var(--admin-muted)", cursor: "pointer" }}
            >
              <X size={20} />
            </button>

            <h2 style={{ marginBottom: 18 }}>{editingId ? "Edit Room" : "Add Room"}</h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <select required value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} style={inputStyle}>
                <option value="">Select Owner</option>
                {owners.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.propertyName || o.name}
                  </option>
                ))}
              </select>
              <input type="text" placeholder="Room Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
              <input type="text" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} />
              <input type="text" placeholder="Address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inputStyle} />
              <input type="text" placeholder="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Price per hour" required value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} style={inputStyle} />
              <input type="text" placeholder="Amenities (comma separated)" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} style={inputStyle} />

              <label style={{ fontSize: 13, color: "var(--admin-muted)" }}>
                Room Images {editingId ? "(leave empty to keep existing)" : ""}
              </label>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} />

              {images.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {images.map((img, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img src={URL.createObjectURL(img)} alt="preview" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        style={{ position: "absolute", top: -6, right: -6, background: "#f43f5e", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer" }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" className="admin-btn" style={{ justifyContent: "center" }}>
                {editingId ? "Update Room" : "Add Room"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  background: "var(--admin-bg)",
  border: "1px solid var(--admin-border)",
  borderRadius: 12,
  padding: "10px 12px",
  color: "var(--admin-text)",
  fontSize: 14,
};

export default ManageHourlyRooms;
