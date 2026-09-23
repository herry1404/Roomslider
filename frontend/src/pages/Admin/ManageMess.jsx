import { useEffect, useState } from "react";
import { UtensilsCrossed, Phone, MapPin, Trash2, Plus, X, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/admin/theme.css";

function ManageMess() {
  const [messList, setMessList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    name: "",
    phone: "",
    password: "",
    address: "",
    latitude: "",
    longitude: "",
    pricePerPerson: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);

  const handleImageChange = (e) => setImages(Array.from(e.target.files));
  const removeImage = (index) => setImages(images.filter((_, i) => i !== index));

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/mess");
      setMessList(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load mess list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImages([]);
    setShowModal(true);
  };

  const openEditModal = (mess) => {
    setEditingId(mess._id);
    setForm({
      name: mess.name,
      phone: mess.phone,
      password: "",
      address: mess.address || "",
      latitude: mess.location?.coordinates?.[1] || "",
      longitude: mess.location?.coordinates?.[0] || "",
      pricePerPerson: mess.pricePerPerson || "",
    });
    setImages([]);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingId && images.length === 0) {
      toast.error("Please select at least one mess image");
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();
      data.append("name", form.name);
      data.append("phone", form.phone);
      if (form.password) data.append("password", form.password);
      data.append("address", form.address);
      data.append("latitude", form.latitude);
      data.append("longitude", form.longitude);
      data.append("pricePerPerson", form.pricePerPerson);
      images.forEach((image) => data.append("images", image));

      if (editingId) {
        await api.put(`/mess/${editingId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Mess updated");
      } else {
        await api.post("/mess", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Mess added");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save mess");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this mess?")) return;
    try {
      await api.delete(`/mess/${id}`);
      toast.success("Mess deleted");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete mess");
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location not supported on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        toast.success("Location captured");
      },
      () => toast.error("Could not get location")
    );
  };

  if (loading) {
    return (
      <div className="admin-page">
        <p style={{ color: "var(--admin-muted)" }}>Loading mess list...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Mess Vendors</h1>
          <p>Sab mess add/manage karo — har mess ka apna login aur menu hoga.</p>
        </div>
        <button className="admin-btn" onClick={openAddModal}>
          <Plus size={18} /> Add Mess
        </button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total Mess</span>
            <div className="admin-stat-icon admin-badge green">
              <UtensilsCrossed size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{messList.length}</div>
        </div>
      </div>

      <div className="admin-table-wrap">
        {messList.length === 0 ? (
          <div className="admin-empty">
            <h3>No mess yet</h3>
            <p>Koi mess add nahi hua hai abhi tak.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mess</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Price/Thali</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messList.map((m) => (
                <tr key={m._id}>
                  <td>
                    <div className="admin-row-thumb">
                      {m.images?.[0] ? (
                        <img src={m.images[0]} alt={m.name} />
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
                          <UtensilsCrossed size={18} />
                        </div>
                      )}
                      <span>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--admin-muted)" }}>{m.phone}</td>
                  <td style={{ color: "var(--admin-muted)" }}>{m.address}</td>
                  <td style={{ fontWeight: 700 }}>₹{m.pricePerPerson}</td>
                  <td>
                    <div className="admin-row-actions" style={{ justifyContent: "flex-end" }}>
                      <button
                        className="admin-icon-btn accent"
                        title="Edit"
                        onClick={() => openEditModal(m)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="admin-icon-btn danger"
                        title="Delete"
                        onClick={() => handleDelete(m._id)}
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

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--admin-card)",
              border: "1px solid var(--admin-border)",
              borderRadius: 16,
              padding: 26,
              width: "100%",
              maxWidth: 420,
              maxHeight: "85vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 14,
                background: "none",
                border: "none",
                color: "var(--admin-muted)",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ marginBottom: 18 }}>{editingId ? "Edit Mess" : "Add Mess"}</h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="text"
                placeholder="Mess Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Phone (10-digit, login username)"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder={editingId ? "Leave blank to keep password" : "Password (min 6 chars)"}
                required={!editingId}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Address"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Price per person (₹)"
                required
                value={form.pricePerPerson}
                onChange={(e) => setForm({ ...form, pricePerPerson: e.target.value })}
                style={inputStyle}
              />

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  required
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  style={inputStyle}
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  required
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <button type="button" className="admin-btn secondary" onClick={useMyLocation}>
                Use My Current Location
              </button>

              <label style={{ fontSize: 13, color: "var(--admin-muted)" }}>
                Mess Images {editingId ? "(leave empty to keep existing)" : ""}
              </label>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} />

              {images.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {images.map((img, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img
                        src={URL.createObjectURL(img)}
                        alt="preview"
                        style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          background: "#f43f5e",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" className="admin-btn" disabled={saving} style={{ justifyContent: "center" }}>
                {saving ? "Saving..." : editingId ? "Update Mess" : "Add Mess"}
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

export default ManageMess;
