import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Trash2, Pencil, Sofa } from "lucide-react";
import api from "../../api/axios";
import confirmAction from "../../utils/confirmAction";
import "../../styles/admin/theme.css";
import "../../styles/admin/furniture-admin.css";

const CATS = [
  { value: "bedroom", label: "Bedroom" },
  { value: "study", label: "Study" },
  { value: "kitchen", label: "Kitchen" },
  { value: "cooling-heating", label: "Cooling & Heating" },
  { value: "laundry-water", label: "Laundry & Water" },
  { value: "essentials", label: "Essentials" },
];

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

function ManageFurniture() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const load = async () => {
    try {
      const res = await api.get("/furniture/admin/all");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Items load nahi ho paaye");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(load);
  }, []);

  const patch = async (id, body, msg) => {
    try {
      await api.put(`/furniture/${id}`, body);
      toast.success(msg);
      setItems((prev) => prev.map((i) => (i._id === id ? { ...i, ...body } : i)));
    } catch {
      toast.error("Update failed");
    }
  };

  const remove = async (id) => {
    if (!await confirmAction("Delete this item?", { confirmText: "Delete" })) return;
    try {
      await api.delete(`/furniture/${id}`);
      toast.success("Item deleted");
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch {
      toast.error("Delete failed");
    }
  };

  const label = (c) => CATS.find((x) => x.value === c)?.label || c;
  const filtered = items.filter(
    (i) =>
      (tab === "all" || i.category === tab) &&
      (!q.trim() || i.name.toLowerCase().includes(q.trim().toLowerCase()))
  );

  const rentFrom = (i) =>
    i.rentPlans && i.rentPlans.length
      ? fmt(Math.min(...i.rentPlans.map((p) => p.monthlyRent))) + "/mo"
      : "-";

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
          <h1>Furniture & Appliances</h1>
          <p>Items for rent and buy. Control price, photos and stock.</p>
        </div>
        <Link to="/admin/furniture/add" className="admin-btn">
          <Plus size={18} /> Add Item
        </Link>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total Items</span>
            <div className="admin-stat-icon admin-badge green"><Sofa size={18} /></div>
          </div>
          <div className="admin-stat-value">{items.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top"><span className="admin-stat-label">Available</span></div>
          <div className="admin-stat-value">{items.filter((i) => i.isAvailable).length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top"><span className="admin-stat-label">Out of stock</span></div>
          <div className="admin-stat-value">{items.filter((i) => !i.isAvailable).length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top"><span className="admin-stat-label">Hidden</span></div>
          <div className="admin-stat-value">{items.filter((i) => !i.isActive).length}</div>
        </div>
      </div>

      <div className="admin-toolbar">
        <button className={`admin-btn ${tab === "all" ? "" : "secondary"}`} onClick={() => setTab("all")}>
          All ({items.length})
        </button>
        {CATS.map((c) => (
          <button key={c.value} className={`admin-btn ${tab === c.value ? "" : "secondary"}`} onClick={() => setTab(c.value)}>
            {c.label} ({items.filter((i) => i.category === c.value).length})
          </button>
        ))}
        <input
          placeholder="Search item..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.25)", background: "var(--admin-bg)", color: "var(--admin-text, #f1f5f9)" }}
        />
      </div>

      <div className="admin-table-wrap">
        {filtered.length === 0 ? (
          <div className="admin-empty">
            <h3>No items found</h3>
            <p>Add one to get started.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Rent from</th>
                <th>Buy</th>
                <th>Available</th>
                <th>Visible</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="fa-thumb">
                        {i.images && i.images[0] ? <img src={i.images[0]} alt="" /> : <Sofa size={18} />}
                      </div>
                      <span style={{ fontWeight: 600 }}>{i.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--admin-muted)" }}>{label(i.category)}</td>
                  <td>{rentFrom(i)}</td>
                  <td>{i.buyPrice ? fmt(i.buyPrice) : "-"}</td>
                  <td>
                    <button
                      type="button"
                      className={`fa-switch ${i.isAvailable ? "on" : ""}`}
                      title={i.isAvailable ? "Available (click for Out of stock)" : "Out of stock (click for Available)"}
                      onClick={() => patch(i._id, { isAvailable: !i.isAvailable }, i.isAvailable ? "Marked out of stock" : "Marked available")}
                    />
                  </td>
                  <td>
                    <span
                      className={`admin-badge ${i.isActive ? "green" : "red"}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => patch(i._id, { isActive: !i.isActive }, i.isActive ? "Hidden from site" : "Visible on site")}
                    >
                      <span className="admin-badge-dot" />
                      {i.isActive ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions" style={{ justifyContent: "flex-end" }}>
                      <Link to={`/admin/furniture/edit/${i._id}`} className="admin-icon-btn" title="Edit">
                        <Pencil size={16} />
                      </Link>
                      <button className="admin-icon-btn danger" title="Delete" onClick={() => remove(i._id)}>
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

export default ManageFurniture;
