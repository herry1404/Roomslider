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
  { value: "study-support", label: "Study Support" },
  { value: "rent-agreement", label: "Rent Agreement" },
];
const PER_UNITS = ["month", "day", "hour", "visit", "washroom", "room", "person", "machine", "page"];

function ManageServices() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [editing, setEditing] = useState(null);
  const [priceList, setPriceList] = useState([]);
  const [editSubtype, setEditSubtype] = useState("");

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

  const savePriceList = async () => {
    try {
      await api.put(`/services/${editing}`, { priceList: priceList.filter((item) => item.name && item.price !== "").map((item) => ({ ...item, price: Number(item.price) })), subType: editSubtype });
      toast.success("Price list updated");
      setEditing(null);
      load();
    } catch {
      toast.error("Price list update failed");
    }
  };

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
                        className="admin-icon-btn accent"
                        title="Edit price list"
                        onClick={() => { setEditing(p._id); setEditSubtype(p.subType || ""); setPriceList((p.priceList || []).map((item) => ({ ...item, price: String(item.price), perUnit: item.perUnit || "month", allowQuantity: Boolean(item.allowQuantity) }))); }}
                      >
                        Edit prices
                      </button>
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
      {editing && (
        <div className="admin-page">
          <h2>Edit Price List</h2>
          {(() => {
            const current = providers.find((item) => item._id === editing);
            const choices = current?.category === "study-support" ? [["library", "Library"], ["tutor", "Tutor"], ["printing", "Printing"], ["exam-help", "Exam help"]] : current?.category === "rent-agreement" ? [["agreement", "Agreement"], ["police-verification", "Police verification"]] : [];
            return choices.length ? <div className="admin-toolbar"><label>Service type <select value={editSubtype} onChange={(e) => setEditSubtype(e.target.value)}>{choices.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div> : null;
          })()}
          {priceList.map((item, index) => (
            <div className="admin-toolbar" key={index}>
              <div className="admin-search"><input aria-label="Service name" placeholder="Service name" value={item.name} onChange={(e) => setPriceList((rows) => rows.map((row, i) => i === index ? { ...row, name: e.target.value } : row))} /></div>
              <select value={item.type} onChange={(e) => setPriceList((rows) => rows.map((row, i) => i === index ? { ...row, type: e.target.value } : row))}><option value="monthly">Monthly</option><option value="one-time">One-time</option></select>
              <div className="admin-search"><input aria-label="Price" type="number" min="0" placeholder="Price" value={item.price} onChange={(e) => setPriceList((rows) => rows.map((row, i) => i === index ? { ...row, price: e.target.value } : row))} /></div>
              <select aria-label="Rate per" value={item.perUnit || "month"} onChange={(e) => setPriceList((rows) => rows.map((row, i) => i === index ? { ...row, perUnit: e.target.value, unit: "" } : row))}>{PER_UNITS.map((unit) => <option key={unit} value={unit}>per {unit}</option>)}</select>
              <label className="admin-badge blue"><input type="checkbox" checked={Boolean(item.allowQuantity)} onChange={(e) => setPriceList((rows) => rows.map((row, i) => i === index ? { ...row, allowQuantity: e.target.checked } : row))} /> Customer chooses quantity</label>
              <button className="admin-btn secondary" onClick={() => setPriceList((rows) => rows.filter((_, i) => i !== index))}>Remove</button>
            </div>
          ))}
          <div className="admin-toolbar">
            <button className="admin-btn secondary" onClick={() => setPriceList((rows) => [...rows, { name: "", type: "monthly", price: "", unit: "", note: "", perUnit: "month", allowQuantity: false }])}>Add price</button>
            <button className="admin-btn" onClick={savePriceList}>Save price list</button>
            <button className="admin-btn secondary" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageServices;
