import { useEffect, useState } from "react";
import { DoorOpen, MapPin, IndianRupee, Trash2, Plus, X, Pencil, Check, Ban } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/manageOwners.css";

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
      console.error("FETCH HOURLY ROOMS ERROR:", error);
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
    setForm({
      ownerId: "",
      title: "",
      description: "",
      address: "",
      city: "",
      pricePerHour: "",
      amenities: "",
    });
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

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

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
        JSON.stringify(
          form.amenities ? form.amenities.split(",").map((a) => a.trim()).filter(Boolean) : []
        )
      );

      images.forEach((image) => {
        data.append("images", image);
      });

      if (editingId) {
        await api.put(`/hourly-rooms/${editingId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Room updated");
      } else {
        await api.post("/hourly-rooms", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Room added");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error("SAVE HOURLY ROOM ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to save room");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this hourly room?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/hourly-rooms/${id}`);
      toast.success("Room deleted");
      fetchData();
    } catch (error) {
      console.error("DELETE HOURLY ROOM ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to delete room");
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/hourly-rooms/${id}/approve`);
      toast.success("Request approved");
      fetchData();
    } catch (error) {
      console.error("APPROVE HOURLY ROOM ERROR:", error);
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
      console.error("REJECT HOURLY ROOM ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to reject");
    }
  };

  return (
    <div className="manage-owners-page">
      <div className="owners-header">
        <div>
          <h1>Hourly Rooms</h1>
          <p>Ghante ke hisaab se book hone wale rooms manage karo</p>
        </div>

        <div className="owners-header-actions">
          <button className="add-owner-btn" onClick={openAddModal}>
            <Plus size={18} />
            Add Room
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-box">Loading rooms...</div>
      ) : (
        <div className="owners-grid">
          {rooms.map((r) => (
            <div className="owner-card" key={r._id}>
              <div className="owner-top">
                <div className="avatar">
                  {r.images && r.images[0] ? (
                    <img src={r.images[0]} alt={r.title} style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
                  ) : (
                    <DoorOpen size={28} />
                  )}
                </div>
                <div>
                  <h3>{r.title}</h3>
                  <span>{r.requestedByOwner?.name || "Admin added"}</span>
                </div>
              </div>

              <div className="owner-details">
                <div className="detail-row">
                  <MapPin size={16} />
                  <p>{r.location?.address}, {r.location?.city}</p>
                </div>
                <div className="detail-row">
                  <IndianRupee size={16} />
                  <p>{r.pricePerHour} / hour</p>
                </div>
                <div className="detail-row">
                  <p>
                    Status:{" "}
                    <strong style={{
                      color:
                        r.status === "approved" ? "#16a34a" :
                        r.status === "rejected" ? "#dc2626" : "#d97706"
                    }}>
                      {r.status}
                    </strong>
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {r.status === "pending" && (
                  <>
                    <button className="delete-btn" style={{ background: "#f0fdf4", color: "#16a34a" }} onClick={() => handleApprove(r._id)}>
                      <Check size={16} />
                      Approve
                    </button>
                    <button className="delete-btn" style={{ background: "#fef2f2", color: "#dc2626" }} onClick={() => handleReject(r._id)}>
                      <Ban size={16} />
                      Reject
                    </button>
                  </>
                )}
                <button className="delete-btn" style={{ background: "#eff6ff", color: "#2563eb" }} onClick={() => openEditModal(r)}>
                  <Pencil size={16} />
                  Edit
                </button>
                <button className="delete-btn" onClick={() => handleDelete(r._id)}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rooms.length === 0 && !loading && (
        <div className="empty-owners">
          <DoorOpen size={45} />
          <h3>No Hourly Rooms Yet</h3>
          <p>Koi hourly room add nahi hua hai abhi tak.</p>
        </div>
      )}

      {showModal && (
        <div className="profile-overlay">
          <div className="profile-modal">
            <button className="close-modal" onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>

            <h2>{editingId ? "Edit Room" : "Add Room"}</h2>

            <form className="add-owner-form" onSubmit={handleSubmit}>
              <select
                required
                value={form.ownerId}
                onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
              >
                <option value="">Select Owner</option>
                {owners.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.propertyName || o.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Room Title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <input
                type="text"
                placeholder="Address"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <input
                type="text"
                placeholder="City"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <input
                type="number"
                placeholder="Price per hour"
                required
                value={form.pricePerHour}
                onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
              />
              <input
                type="text"
                placeholder="Amenities (comma separated)"
                value={form.amenities}
                onChange={(e) => setForm({ ...form, amenities: e.target.value })}
              />

              <label style={{ fontWeight: 600, marginTop: 8 }}>
                Room Images {editingId ? "(leave empty to keep existing)" : ""}
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
              />

              {images.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {images.map((img, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img
                        src={URL.createObjectURL(img)}
                        alt="preview"
                        style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          background: "#dc2626",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" className="submit-btn">
                {editingId ? "Update Room" : "Add Room"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageHourlyRooms;
