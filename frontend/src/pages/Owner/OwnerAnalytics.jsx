import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/axios";
import "../../styles/owner/analytics.css";

const ranges = ["7d", "30d", "90d"];

function OwnerAnalytics() {
  const [range, setRange] = useState("7d");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get("/analytics/owner", { params: { range } })
      .then(({ data }) => { if (active) setAnalytics(data.analytics); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || "Analytics could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [range]);

  const totals = analytics?.totals || {};
  return (
    <main className="owner-analytics-page">
      <header className="owner-analytics-header">
        <div><Link to="/owner/dashboard">← Dashboard</Link><h1>Analytics</h1><p>Listing activity recorded by RoomSlider.</p></div>
        <label>Range <select value={range} onChange={(event) => setRange(event.target.value)}>{ranges.map((item) => <option key={item}>{item}</option>)}</select></label>
      </header>
      {loading ? <div className="owner-analytics-loading" role="status"><span>Loading your analytics…</span><div className="owner-analytics-skeleton-grid">{Array.from({ length: 5 }, (_, index) => <i key={index} />)}</div><div className="owner-analytics-skeleton-chart" />
      </div>
        : error ? <p className="owner-analytics-error" role="alert">{error}</p>
          : <>
            <section className="owner-analytics-stats">
              {[["Views", totals.views], ["Unique visitors", totals.uniqueVisitors], ["Calls", totals.calls], ["WhatsApp", totals.whatsapp], ["Contact requests", totals.contacts], ["Wishlist adds", totals.wishlistAdds], ["Conversion", `${Number(totals.conversion || 0).toFixed(1)}%`]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value ?? 0}</strong></article>)}
            </section>
            {!analytics?.totals?.views && <p className="owner-analytics-empty">No listing activity yet for this range.</p>}
            <section className="owner-analytics-panel">
              <h2>Daily views and contacts</h2>
              <div className="owner-analytics-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.daily || []} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#16a34a" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="contacts" stroke="#0f766e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="owner-analytics-panel">
              <h2>Per-room performance</h2>
              <div className="owner-analytics-table-wrap"><table><thead><tr><th>Room</th><th>Views</th><th>Contacts</th><th>Conversion</th></tr></thead><tbody>
                {(analytics?.rooms || []).map((room) => <tr key={room.id}><td>{room.title || "Listing"}</td><td>{room.views}</td><td>{room.contacts}</td><td>{Number(room.conversion || 0).toFixed(1)}%</td></tr>)}
                {!analytics?.rooms?.length && <tr><td colSpan="4">No room activity for this range.</td></tr>}
              </tbody></table></div>
            </section>
            <section className="owner-analytics-panel">
              <h2>Recent contacts</h2>
              <div className="owner-analytics-table-wrap"><table><thead><tr><th>Time</th><th>Room</th><th>Action</th><th>Visitor</th><th>Phone</th></tr></thead><tbody>
                {(analytics?.contacts || []).map((contact) => <tr key={contact._id}><td>{new Date(contact.createdAt).toLocaleString()}</td><td>{contact.room || "Listing"}</td><td>{contact.actionType.replaceAll("_", " ")}</td><td>{contact.userName}</td><td>{contact.userPhone || "—"}</td></tr>)}
                {!analytics?.contacts?.length && <tr><td colSpan="5">No contacts recorded yet.</td></tr>}
              </tbody></table></div>
            </section>
          </>}
    </main>
  );
}

export default OwnerAnalytics;
