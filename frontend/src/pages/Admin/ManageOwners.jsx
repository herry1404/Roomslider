import { useEffect, useState } from "react";
import {
  UserCog,
  Phone,
  Building2,
  Home,
  Trash2,
  Plus,
  Search,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../../styles/admin/theme.css";

function ManageOwners() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    propertyName: "",
  });

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const res = await api.get("/owners");
      setOwners(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Owners load nahi ho paye");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleAddOwner = async (e) => {
    e.preventDefault();
    try {
      await api.post("/owners", form);
      toast.success("Owner created successfully");
      setShowAddModal(false);
      setForm({ name: "", phone: "", password: "", propertyName: "" });
      fetchOwners();
    } catch (error) {
      toast.error(error.response?.data?.message || "Owner create failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Kya aap is owner ko delete karna chahte ho?")) return;

    try {
      await api.delete(`/owners/${id}`);
      toast.success("Owner deleted successfully");
      fetchOwners();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const filteredOwners = owners.filter((owner) => {
    const value = search.toLowerCase();
    return (
      owner.name?.toLowerCase().includes(value) ||
      owner.phone?.toLowerCase().includes(value) ||
      owner.propertyName?.toLowerCase().includes(value)
    );
  });

  const totalRooms = owners.reduce((sum, o) => sum + (o.totalRooms || 0), 0);
  const occupiedRooms = owners.reduce((sum, o) => sum + (o.occupiedRooms || 0), 0);

  if (loading) {
    return (
      <div className="admin-page">
        <p style={{ color: "var(--admin-muted)" }}>Loading owners...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Manage Owners</h1>
          <p>Property owners ko manage kare.</p>
        </div>
        <button className="admin-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Add Owner
        </button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total Owners</span>
            <div className="admin-stat-icon admin-badge green">
              <UserCog size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{owners.length}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total Rooms</span>
            <div className="admin-stat-icon admin-badge blue">
              <Home size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{totalRooms}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Occupied Rooms</span>
            <div className="admin-stat-icon admin-badge green">
              <Building2 size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{occupiedRooms}</div>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search owner or property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-table-wrap">
        {filteredOwners.length === 0 ? (
          <div className="admin-empty">
            <h3>No owners found</h3>
            <p>Koi owner add nahi hua hai abhi tak.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Owner</th>
                <th>Phone</th>
                <th>Total</th>
                <th>Occupied</th>
                <th>Vacant</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOwners.map((owner) => (
                <tr
                  key={owner._id}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/admin/owners/${owner._id}`)}
                >
                  <td>
                    <div className="admin-row-thumb">
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "var(--admin-accent-soft)",
                          color: "var(--admin-accent)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <UserCog size={18} />
                      </div>
                      <div>
                        <div>{owner.name}</div>
                        <div style={{ fontSize: 12, color: "var(--admin-muted)", fontWeight: 400 }}>
                          {owner.propertyName || "No property name"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--admin-muted)" }}>{owner.phone}</td>
                  <td style={{ fontWeight: 700 }}>{owner.totalRooms || 0}</td>
                  <td>
                    <span className="admin-badge blue">
                      <span className="admin-badge-dot" />
                      {owner.occupiedRooms || 0}
                    </span>
                  </td>
                  <td>
                    <span className="admin-badge amber">
                      <span className="admin-badge-dot" />
                      {owner.vacantRooms || 0}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="admin-row-actions" style={{ justifyContent: "flex-end" }}>
                      <button
                        className="admin-icon-btn danger"
                        title="Delete"
                        onClick={() => handleDelete(owner._id)}
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

      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--admin-card)",
              border: "1px solid var(--admin-border)",
              borderRadius: 16,
              padding: 26,
              width: "90%",
              maxWidth: 400,
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowAddModal(false)}
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

            <h2 style={{ marginBottom: 18 }}>Add New Owner</h2>

            <form
              onSubmit={handleAddOwner}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {["name", "phone", "password", "propertyName"].map((f) => null)}
              <input
                type="text"
                placeholder="Owner Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
              />
              <input
                type="tel"
                placeholder="Mobile Number (e.g. 9876543210)"
                required
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Property Name (e.g. Ambe's Building)"
                value={form.propertyName}
                onChange={(e) => setForm({ ...form, propertyName: e.target.value })}
                style={inputStyle}
              />

              <button type="submit" className="admin-btn" style={{ justifyContent: "center" }}>
                Create Owner
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

export default ManageOwners;
