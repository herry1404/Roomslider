import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/axios";
import "../../styles/admin/theme.css";

function EventAnalytics() {
  const [range, setRange] = useState("7d");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get("/analytics/admin", { params: { range } })
      .then(({ data }) => { if (active) setAnalytics(data.analytics); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || "Analytics could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [range]);

  const totals = analytics?.totals || {};
  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div><span className="admin-analytics-eyebrow">EVENT-BASED REPORTING</span><h1>Analytics</h1><p>Only recorded RoomSlider events are included.</p></div>
        <label className="event-analytics-range">Range <select value={range} onChange={(event) => setRange(event.target.value)}>{["7d", "30d", "90d"].map((item) => <option key={item}>{item}</option>)}</select></label>
      </header>
      {loading ? <section className="admin-analytics-card" role="status">Loading analytics…</section>
        : error ? <section className="admin-analytics-card" role="alert">{error}</section>
          : <>
            <section className="admin-stats-grid">
              {[["Views", totals.views], ["Unique visitors", totals.uniqueVisitors], ["Contact requests", totals.contacts], ["Conversion", `${Number(totals.conversion || 0).toFixed(1)}%`]].map(([label, value]) => <article className="admin-stat-card" key={label}><span>{label}</span><strong>{value ?? 0}</strong></article>)}
            </section>
            <section className="admin-analytics-section">
              <div className="admin-analytics-section-heading"><div><h2>Views → contacts</h2><p>Daily recorded listing views and contact requests.</p></div></div>
              <div className="admin-analytics-card admin-analytics-chart">
                <ResponsiveContainer width="100%" height="100%"><LineChart data={analytics?.daily || []}>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} /><Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#16a34a" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="contacts" stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart></ResponsiveContainer>
              </div>
            </section>
            <section className="admin-analytics-grid">
              <AnalyticsTable title="Top rooms" headers={["Room", "Views", "Contacts"]} rows={(analytics?.topRooms || []).map((item) => [item.title || "Listing", item.views, item.contacts])} />
              <AnalyticsTable title="Owner performance" headers={["Owner", "Views", "Contacts", "Conversion"]} rows={(analytics?.owners || []).map((item) => [item.name || "Owner", item.views, item.contacts, `${Number(item.conversion || 0).toFixed(1)}%`])} />
              <AnalyticsTable title="Top sources" headers={["Source", "Events"]} rows={(analytics?.sources || []).map((item) => [item.source, item.count])} />
              <AnalyticsTable title="Device split" headers={["Device", "Events"]} rows={(analytics?.devices || []).map((item) => [item.device, item.count])} />
              <AnalyticsTable title="Ad performance" headers={["Ad", "Impressions", "Clicks", "CTR", "Unique visitors", "By day"]} rows={(analytics?.ads || []).map((item) => [item.text || String(item.adId), item.impressions, item.clicks, `${Number(item.ctr || 0).toFixed(2)}%`, item.uniqueVisitors, (item.byDay || []).map((day) => `${day.date}: ${day.impressions} imp. / ${day.clicks} clicks`).join(" · ") || "No activity"])} />
            </section>
            {!totals.views && <p className="admin-analytics-empty">No events recorded for this range.</p>}
          </>}
      <style>{`.event-analytics-range{display:flex;align-items:center;gap:8px;color:var(--admin-muted);font-size:13px}.event-analytics-range select{padding:9px 12px;border:1px solid var(--admin-border);border-radius:9px;background:var(--admin-card);color:var(--admin-text)}.admin-stat-card{padding:16px;border:1px solid var(--admin-border);border-radius:14px;background:var(--admin-card)}.admin-stat-card span{display:block;color:var(--admin-muted);font-size:12px}.admin-stat-card strong{display:block;margin-top:7px;color:#4ade80;font-size:24px}.admin-analytics-section .admin-analytics-chart{box-sizing:border-box}.admin-analytics-section .admin-analytics-chart{padding:16px}.admin-analytics-section .admin-analytics-chart .recharts-responsive-container{height:100%!important}.admin-analytics-table-wrap{overflow-x:auto}.admin-table{width:100%;border-collapse:collapse}.admin-table th,.admin-table td{padding:10px 8px;border-bottom:1px solid var(--admin-border);text-align:left}.admin-table th{color:var(--admin-muted);font-size:12px}.admin-table td{color:var(--admin-text);font-size:13px}.admin-analytics-empty{color:var(--admin-muted)}`}</style>
    </main>
  );
}

function AnalyticsTable({ title, headers, rows }) {
  return <section className="admin-analytics-card"><h2>{title}</h2><div className="admin-analytics-table-wrap"><table className="admin-table"><thead><tr>{headers.map((item) => <th key={item}>{item}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${title}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cellIndex}`}>{cell}</td>)}</tr>)}{!rows.length && <tr><td colSpan={headers.length}>No data for this range.</td></tr>}</tbody></table></div></section>;
}

export default EventAnalytics;
