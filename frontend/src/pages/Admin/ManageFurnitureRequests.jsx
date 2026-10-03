import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Phone, MessageCircle, MapPin, ClipboardList } from "lucide-react";
import api from "../../api/axios";
import "../../styles/admin/theme.css";
import "../../styles/admin/furniture-admin.css";

const STATUSES = ["new", "confirmed", "delivered", "cancelled"];
const BADGE = { new: "green", confirmed: "green", delivered: "green", cancelled: "red" };

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const waLink = (phone) => `https://wa.me/91${String(phone || "").replace(/\D/g, "").slice(-10)}`;

function ManageFurnitureRequests() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  const load = async () => {
    try {
      const res = await api.get("/furniture-requests");
      setList(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Requests load nahi ho paaye");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(load);
  }, []);

  const setStatus = async (id, status) => {
    try {
      await api.put(`/furniture-requests/${id}/status`, { status });
      setList((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
      toast.success("Status updated");
    } catch {
      toast.error("Update failed");
    }
  };

  const shown = tab === "all" ? list : list.filter((r) => r.status === tab);
  const count = (s) => (s === "all" ? list.length : list.filter((r) => r.status === s).length);

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
          <h1>Furniture Requests</h1>
          <p>Requests sent from the Furniture & Appliances page.</p>
        </div>
        <Link to="/admin/furniture" className="admin-btn secondary">
          Manage Items
        </Link>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total Requests</span>
            <div className="admin-stat-icon admin-badge green"><ClipboardList size={18} /></div>
          </div>
          <div className="admin-stat-value">{list.length}</div>
        </div>
        {STATUSES.slice(0, 3).map((s) => (
          <div className="admin-stat-card" key={s}>
            <div className="admin-stat-top">
              <span className="admin-stat-label" style={{ textTransform: "capitalize" }}>{s}</span>
            </div>
            <div className="admin-stat-value">{count(s)}</div>
          </div>
        ))}
      </div>

      <div className="admin-toolbar">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            className={`admin-btn ${tab === s ? "" : "secondary"}`}
            style={{ textTransform: "capitalize" }}
            onClick={() => setTab(s)}
          >
            {s} ({count(s)})
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        {shown.length === 0 ? (
          <div className="admin-empty">
            <h3>No requests yet</h3>
            <p>New requests will show up here.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.requestCode}</div>
                    <div style={{ color: "var(--admin-muted)", fontSize: 12 }}>
                      {new Date(r.createdAt).toLocaleString("en-IN")}
                    </div>
                    {r.deliveryDate && (
                      <div style={{ color: "var(--admin-muted)", fontSize: 12 }}>Deliver: {r.deliveryDate}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ color: "var(--admin-muted)", fontSize: 12 }}>{r.phone}</div>
                    <div className="admin-row-actions" style={{ marginTop: 6 }}>
                      <a className="admin-icon-btn" href={`tel:${r.phone}`} title="Call"><Phone size={15} /></a>
                      <a className="admin-icon-btn" href={waLink(r.phone)} target="_blank" rel="noreferrer" title="WhatsApp"><MessageCircle size={15} /></a>
                    </div>
                  </td>
                  <td style={{ color: "var(--admin-muted)", maxWidth: 220 }}>
                    {[
                      r.address.house,
                      r.address.building,
                      r.address.area,
                      r.address.landmark ? "Near " + r.address.landmark : "",
                      r.address.city,
                      r.address.state,
                      r.address.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    {r.mapsLink && (
                      <div style={{ marginTop: 6 }}>
                        <a href={r.mapsLink} target="_blank" rel="noreferrer" style={{ color: "var(--admin-accent)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={13} /> Open map
                        </a>
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 13, maxWidth: 240 }}>
                    {r.items.map((l, i) => (
                      <div key={i}>
                        {l.qty}x {l.name}{" "}
                        <span style={{ color: "var(--admin-muted)" }}>
                          ({l.mode === "rent" ? `${l.months}m rent` : l.cond === "used" ? "buy, used" : "buy"})
                        </span>
                      </div>
                    ))}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 700 }}>{fmt(r.totals.initial)}</div>
                    {r.totals.rentMonthly > 0 && (
                      <div style={{ color: "var(--admin-muted)" }}>{fmt(r.totals.rentMonthly)}/mo rent</div>
                    )}
                  </td>
                  <td>
                    <span className={`admin-badge ${BADGE[r.status] || "green"}`} style={{ marginBottom: 6 }}>
                      <span className="admin-badge-dot" />
                      <span style={{ textTransform: "capitalize" }}>{r.status}</span>
                    </span>
                    <div>
                      <select
                        value={r.status}
                        onChange={(e) => setStatus(r._id, e.target.value)}
                        style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.25)", background: "var(--admin-bg)", color: "var(--admin-text, #f1f5f9)" }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
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

export default ManageFurnitureRequests;
