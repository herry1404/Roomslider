import { useEffect, useState } from "react";
import { UtensilsCrossed, Phone, MapPin, Trash2, Plus, X, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/manageOwners.css";

function ManageMess() {
  const [messList, setMessList] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/mess");
      setMessList(res.data || []);
    } catch (error) {
      console.error("FETCH MESS ERROR:", error);
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
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/mess/${editingId}`, form);
        toast.success("Mess updated");
      } else {
        await api.post("/mess", form);
        toast.success("Mess added");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error("SAVE MESS ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to save mess");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this mess?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/mess/${id}`);
      toast.success("Mess deleted");
      fetchData();
    } catch (error) {
      console.error("DELETE MESS ERROR:", error);
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
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        toast.success("Location captured");
      },
      () => toast.error("Could not get location")
    );
  };

  return (
    <div className="manage-owners-page">
      <div className="owners-header">
        <div>
          <h1>Mess Vendors</h1>
          <p>Sab mess add/manage karo — har mess ka apna login aur menu hoga</p>
        </div>

        <div className="owners-header-actions">
          <button className="add-owner-btn" onClick={openAddModal}>
            <Plus size={18} />
            Add Mess
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-box">Loading mess list...</div>
      ) : (
        <div className="owners-grid">
          {messList.map((m) => (
            <div className="owner-card" key={m._id}>
              <div className="owner-top">
                <div className="avatar">
                  <UtensilsCrossed size={28} />
                </div>
                <div>
                  <h3>{m.name}</h3>
                  <span>₹{m.pricePerPerson}/thali</span>
                </div>
              </div>

              <div className="owner-details">
                <div className="detail-row">
                  <Phone size={16} />
                  <p>{m.phone}</p>
                </div>
                <div className="detail-row">
                  <MapPin size={16} />
                  <p>{m.address}</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="delete-btn" style={{ background: "#eff6ff", color: "#2563eb" }} onClick={() => openEditModal(m)}>
                  <Pencil size={16} />
                  Edit
                </button>
                <button className="delete-btn" onClick={() => handleDelete(m._id)}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {messList.length === 0 && !loading && (
        <div className="empty-owners">
          <UtensilsCrossed size={45} />
          <h3>No Mess Yet</h3>
          <p>Koi mess add nahi hua hai abhi tak.</p>
        </div>
      )}

      {showModal && (
        <div className="profile-overlay">
          <div className="profile-modal">
            <button className="close-modal" onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>

            <h2>{editingId ? "Edit Mess" : "Add Mess"}</h2>

            <form className="add-owner-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Mess Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Phone (10-digit, login username)"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <input
                type="password"
                placeholder={editingId ? "Leave blank to keep password" : "Password (min 6 chars)"}
                required={!editingId}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <input
                type="text"
                placeholder="Address"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <input
                type="number"
                placeholder="Price per person (₹)"
                required
                value={form.pricePerPerson}
                onChange={(e) => setForm({ ...form, pricePerPerson: e.target.value })}
              />

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  required
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  required
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                />
              </div>

              <button type="button" className="submit-btn" style={{ background: "var(--color-surface-2)", color: "var(--color-text)" }} onClick={useMyLocation}>
                Use My Current Location
              </button>

              <button type="submit" className="submit-btn">
                {editingId ? "Update Mess" : "Add Mess"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageMess;
