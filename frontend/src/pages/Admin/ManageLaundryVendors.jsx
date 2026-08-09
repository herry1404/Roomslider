import { useEffect, useState } from "react";
import { Shirt, Phone, Trash2, Plus, X, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/manageOwners.css";

function ManageLaundryVendors() {
  const [vendors, setVendors] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    ownerId: "",
    vendorName: "",
    phone: "",
    area: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vendorsRes, ownersRes] = await Promise.all([
        api.get("/laundry-vendors"),
        api.get("/owners"),
      ]);
      setVendors(vendorsRes.data.vendors || []);
      setOwners(ownersRes.data || []);
    } catch (error) {
      console.error("FETCH LAUNDRY VENDORS ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ownerId: "", vendorName: "", phone: "", area: "" });
    setShowModal(true);
  };

  const openEditModal = (vendor) => {
    setEditingId(vendor._id);
    setForm({
      ownerId: vendor.owner?._id || "",
      vendorName: vendor.vendorName,
      phone: vendor.phone,
      area: vendor.area || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/laundry-vendors/${editingId}`, form);
        toast.success("Vendor updated");
      } else {
        await api.post("/laundry-vendors", form);
        toast.success("Vendor added");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error("SAVE LAUNDRY VENDOR ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to save vendor");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this vendor?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/laundry-vendors/${id}`);
      toast.success("Vendor deleted");
      fetchData();
    } catch (error) {
      console.error("DELETE LAUNDRY VENDOR ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to delete vendor");
    }
  };

  return (
    <div className="manage-owners-page">
      <div className="owners-header">
        <div>
          <h1>Laundry Vendors</h1>
          <p>Har owner (building) ke liye laundry vendor set karo</p>
        </div>

        <div className="owners-header-actions">
          <button className="add-owner-btn" onClick={openAddModal}>
            <Plus size={18} />
            Add Vendor
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-box">Loading vendors...</div>
      ) : (
        <div className="owners-grid">
          {vendors.map((v) => (
            <div className="owner-card" key={v._id}>
              <div className="owner-top">
                <div className="avatar">
                  <Shirt size={28} />
                </div>
                <div>
                  <h3>{v.vendorName}</h3>
                  <span>{v.owner?.propertyName || v.owner?.name || "Unknown building"}</span>
                </div>
              </div>

              <div className="owner-details">
                <div className="detail-row">
                  <Phone size={16} />
                  <p>{v.phone}</p>
                </div>
                {v.area && (
                  <div className="detail-row">
                    <p>Area: {v.area}</p>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="delete-btn" style={{ background: "#eff6ff", color: "#2563eb" }} onClick={() => openEditModal(v)}>
                  <Pencil size={16} />
                  Edit
                </button>
                <button className="delete-btn" onClick={() => handleDelete(v._id)}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {vendors.length === 0 && !loading && (
        <div className="empty-owners">
          <Shirt size={45} />
          <h3>No Vendors Yet</h3>
          <p>Koi laundry vendor add nahi hua hai abhi tak.</p>
        </div>
      )}

      {showModal && (
        <div className="profile-overlay">
          <div className="profile-modal">
            <button className="close-modal" onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>

            <h2>{editingId ? "Edit Vendor" : "Add Vendor"}</h2>

            <form className="add-owner-form" onSubmit={handleSubmit}>
              <select
                required
                value={form.ownerId}
                onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
              >
                <option value="">Select Owner (Building)</option>
                {owners.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.propertyName || o.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Vendor Name"
                required
                value={form.vendorName}
                onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
              />
              <input
                type="text"
                placeholder="Phone (10-digit)"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <input
                type="text"
                placeholder="Area label (optional, e.g. Bawarkuan)"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              />

              <button type="submit" className="submit-btn">
                {editingId ? "Update Vendor" : "Add Vendor"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageLaundryVendors;
