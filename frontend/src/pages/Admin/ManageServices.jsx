import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Trash2, MapPin, Sparkles } from "lucide-react";
import api from "../../api/axios";
import "../../styles/admin/theme.css";

const CATEGORIES = [
  { value: "cleaning", label: "Cleaning & Housekeeping" },
  { value: "packers", label: "Packers & Movers" },
  { value: "furniture", label: "Furniture & Appliance Rental" },
  { value: "wifi", label: "WiFi & RO Water" },
  { value: "appliance-repair", label: "Appliance Repair" },
];

function ManageServices() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/services");
      setProviders(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Providers load nahi ho paaye");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const deleteProvider = async (id) => {
    if (!window.confirm("Delete this provider?")) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success("Provider deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  const filtered =
    activeTab === "all" ? providers : providers.filter((p) => p.category === activeTab);

  const countFor = (cat) =>
    cat === "all" ? providers.length : providers.filter((p) => p.category === cat).length;

  const labelFor = (cat) => CATEGORIES.find((c) => c.value === cat)?.label || cat;

  if (loading) {
    return (
      <div className="admin-page">
        <p style={{ color: "var(--admin-muted)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Other Services</h1>
          <p>Cleaning, movers, furniture rental, WiFi & RO, appliance repair providers.</p>
        </div>
        <Link to="/admin/services/add" className="admin-btn">
          <Plus size={18} /> Add Provider
        </Link>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total Providers</span>
            <div className="admin-stat-icon admin-badge green">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{providers.length}</div>
        </div>
        {CATEGORIES.slice(0, 3).map((c) => (
          <div className="admin-stat-card" key={c.value}>
            <div className="admin-stat-top">
              <span className="admin-stat-label">{c.label}</span>
            </div>
            <div className="admin-stat-value">{countFor(c.value)}</div>
          </div>
        ))}
      </div>

      <div className="admin-toolbar">
        <button
          className={`admin-btn ${activeTab === "all" ? "" : "secondary"}`}
          onClick={() => setActiveTab("all")}
        >
          All ({countFor("all")})
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            className={`admin-btn ${activeTab === c.value ? "" : "secondary"}`}
            onClick={() => setActiveTab(c.value)}
          >
            {c.label} ({countFor(c.value)})
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        {filtered.length === 0 ? (
          <div className="admin-empty">
            <h3>No providers found</h3>
            <p>Add one to get started.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Area</th>
                <th>Contact</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td style={{ color: "var(--admin-muted)" }}>{labelFor(p.category)}</td>
                  <td style={{ color: "var(--admin-muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <MapPin size={13} /> {p.area}, {p.city}
                    </span>
                  </td>
                  <td style={{ color: "var(--admin-muted)" }}>{p.contactNumber}</td>
                  <td>
                    <span className={`admin-badge ${p.isActive ? "green" : "red"}`}>
                      <span className="admin-badge-dot" />
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions" style={{ justifyContent: "flex-end" }}>
                      <button
                        className="admin-icon-btn danger"
                        title="Delete"
                        onClick={() => deleteProvider(p._id)}
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

export default ManageServices;
