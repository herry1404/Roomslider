import { useEffect, useState } from "react";
import { Shirt, Phone, Trash2, Plus, X, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/admin/theme.css";

function ManageLaundryVendors() {
  const [vendors, setVendors] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({ ownerId: "", vendorName: "", phone: "", area: "" });

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
      toast.error(error.response?.data?.message || "Failed to save vendor");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vendor?")) return;
    try {
      await api.delete(`/laundry-vendors/${id}`);
      toast.success("Vendor deleted");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete vendor");
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <p style={{ color: "var(--admin-muted)" }}>Loading vendors...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Laundry Vendors</h1>
          <p>Har owner (building) ke liye laundry vendor set karo.</p>
        </div>
        <button className="admin-btn" onClick={openAddModal}>
          <Plus size={18} /> Add Vendor
        </button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total Vendors</span>
            <div className="admin-stat-icon admin-badge green">
              <Shirt size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{vendors.length}</div>
        </div>
      </div>

      <div className="admin-table-wrap">
        {vendors.length === 0 ? (
          <div className="admin-empty">
            <h3>No vendors yet</h3>
            <p>Koi laundry vendor add nahi hua hai abhi tak.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Building</th>
                <th>Phone</th>
                <th>Area</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v._id}>
                  <td>
                    <div className="admin-row-thumb">
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: "var(--admin-accent-soft)",
                          color: "var(--admin-accent)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Shirt size={16} />
                      </div>
                      <span>{v.vendorName}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--admin-muted)" }}>
                    {v.owner?.propertyName || v.owner?.name || "Unknown building"}
                  </td>
                  <td style={{ color: "var(--admin-muted)" }}>{v.phone}</td>
                  <td style={{ color: "var(--admin-muted)" }}>{v.area || "-"}</td>
                  <td>
                    <div className="admin-row-actions" style={{ justifyContent: "flex-end" }}>
                      <button className="admin-icon-btn accent" title="Edit" onClick={() => openEditModal(v)}>
                        <Pencil size={16} />
                      </button>
                      <button className="admin-icon-btn danger" title="Delete" onClick={() => handleDelete(v._id)}>
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
              maxWidth: 400,
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", color: "var(--admin-muted)", cursor: "pointer" }}
            >
              <X size={20} />
            </button>

            <h2 style={{ marginBottom: 18 }}>{editingId ? "Edit Vendor" : "Add Vendor"}</h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <select
                required
                value={form.ownerId}
                onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
                style={inputStyle}
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
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Phone (10-digit)"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Area label (optional, e.g. Bawarkuan)"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                style={inputStyle}
              />

              <button type="submit" className="admin-btn" style={{ justifyContent: "center" }}>
                {editingId ? "Update Vendor" : "Add Vendor"}
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

export default ManageLaundryVendors;
