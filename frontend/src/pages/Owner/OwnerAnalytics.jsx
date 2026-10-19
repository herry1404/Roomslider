import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import FilterBar from "../../components/analytics/FilterBar";
import RankList from "../../components/analytics/RankList";
import StatCard from "../../components/analytics/StatCard";
import TrendChart from "../../components/analytics/TrendChart";
import "../../styles/admin/theme.css";
import "../../components/analytics/analytics.css";

const readFilters = (params) => ({
  range: params.get("from") && params.get("to") ? "custom" : params.get("range") || "7d",
  from: params.get("from") || "",
  to: params.get("to") || "",
  category: params.get("category") || "",
  area: params.get("area") || "",
  compare: params.get("compare") === "1",
});

function OwnerAnalytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const changeFilters = useCallback((changes) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (key === "range" && value) {
        next.set(key, value);
        next.delete("from");
        next.delete("to");
      } else if (key === "range") next.delete(key);
      else if ((key === "from" || key === "to") && value) {
        next.set(key, value);
        next.delete("range");
      } else if (key === "compare") {
        if (value) next.set(key, "1");
        else next.delete(key);
      } else if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (filters.from && filters.to) {
      params.set("from", filters.from);
      params.set("to", filters.to);
    } else params.set("range", filters.range === "live" ? "today" : filters.range);
    if (filters.category) params.set("category", filters.category);
    if (filters.area) params.set("area", filters.area);
    if (filters.compare) params.set("compare", "1");
    api.get(`/analytics/owner/overview?${params}`)
      .then(({ data }) => { if (active) setAnalytics(data.analytics); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || "Analytics could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters]);

  const totals = analytics?.totals || {};
  const daily = analytics?.daily || [];
  return <main className="admin-page analytics-dashboard owner-analytics-dashboard">
    <header className="admin-page-header">
      <div><Link to="/owner/dashboard" className="analytics-back-link">← Dashboard</Link><span className="admin-analytics-eyebrow">YOUR LISTINGS</span><h1>Analytics</h1><p>Views and contacts for your rooms only.</p></div>
    </header>
    <FilterBar filters={filters} onChange={changeFilters} />
    {error && <div className="analytics-error" role="alert">{error}</div>}
    {loading ? <AnalyticsSkeleton /> : analytics && <>
      <section className="admin-stats-grid analytics-stat-grid">
        <StatCard label="Views" value={totals.views} growth={analytics.comparison?.growth?.views} sparkline={daily.map((row) => ({ value: row.views }))} />
        <StatCard label="Calls" value={totals.calls} growth={analytics.comparison?.growth?.calls} sparkline={daily.map((row) => ({ value: row.calls }))} />
        <StatCard label="WhatsApp" value={totals.whatsapp} growth={analytics.comparison?.growth?.whatsapp} sparkline={daily.map((row) => ({ value: row.whatsapp }))} />
        <StatCard label="Wishlist" value={totals.wishlist} growth={analytics.comparison?.growth?.wishlist} sparkline={daily.map((row) => ({ value: row.wishlist }))} />
        <StatCard label="Conversion" value={totals.conversion} suffix="%" />
      </section>
      <section className="analytics-dashboard-section">
        <TrendChart data={daily} title="Daily listing activity" />
      </section>
      <section className="admin-analytics-grid analytics-main-grid">
        <article className="admin-analytics-card analytics-room-table">
          <header className="analytics-card-header"><h2>Per-room performance</h2></header>
          {analytics.topListings?.length ? <div className="admin-analytics-table-wrap"><table className="admin-analytics-table">
            <thead><tr><th>Room</th><th>Views</th><th>Calls</th><th>WhatsApp</th><th>Contacts</th><th>Conversion</th></tr></thead>
            <tbody>{analytics.topListings.map((room) => <tr key={`${room.entityType}-${room.entityId}`}><td>{room.title}</td><td>{room.views}</td><td>{room.calls}</td><td>{room.whatsapp}</td><td>{room.contacts}</td><td>{Number(room.conversion || 0).toFixed(1)}%</td></tr>)}</tbody>
          </table></div> : <div className="admin-empty"><h3>No room activity yet</h3><p>Your listing performance appears when visitors view your rooms.</p></div>}
        </article>
        <RankList title="Views hain par contact nahi" rows={analytics.noContactListings} valueKey="views" emptyMessage="Every viewed room received a call or WhatsApp contact." />
      </section>
    </>}
  </main>;
}

function AnalyticsSkeleton() {
  return <div className="analytics-skeleton" role="status" aria-label="Loading analytics">
    <div className="admin-stats-grid analytics-stat-grid">{Array.from({ length: 5 }, (_, index) => <span className="skeleton shimmer analytics-skeleton-card" key={index} />)}</div>
    <span className="skeleton shimmer analytics-skeleton-chart" />
  </div>;
}

export default OwnerAnalytics;
