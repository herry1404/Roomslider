import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
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
  category: "",
  area: "",
  compare: params.get("compare") === "1",
});

export default function CafeAnalytics() {
  const { cafeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
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
      }
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
    if (filters.compare) params.set("compare", "1");
    api.get(`/analytics/cafe/${encodeURIComponent(cafeId)}?${params}`)
      .then(({ data }) => { if (active) setAnalytics(data.analytics); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || "Cafe analytics could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [cafeId, filters]);

  return <main className="admin-page analytics-dashboard">
    <header className="admin-page-header">
      <div><Link to="/admin/cafe-menus" className="analytics-back-link">← Cafe menus</Link><span className="admin-analytics-eyebrow">CAFE MENU PERFORMANCE</span><h1>Cafe Analytics</h1><p>Scans, menu activity and peak hours.</p></div>
    </header>
    <FilterBar filters={filters} onChange={changeFilters} hideCategoryArea />
    {error && <div className="analytics-error" role="alert">{error}</div>}
    {loading ? <AnalyticsSkeleton /> : analytics && <>
      <section className="admin-stats-grid analytics-stat-grid">
        <StatCard label="Menu scans" value={analytics.totals.scans} growth={analytics.comparison?.growth?.scans} />
        <StatCard label="Menu item views" value={analytics.totals.menuItemViews} growth={analytics.comparison?.growth?.menuItemViews} />
      </section>
      <section className="admin-analytics-grid analytics-main-grid">
        <TrendChart title="Scans per day" data={analytics.daily} series={[["scans", "Scans"]]} />
        <RankList title="Peak hours (IST)" rows={analytics.peakHours} labelKey="hour" valueKey="scans" emptyMessage="No scans recorded yet." />
        <RankList title="Top menu items" rows={analytics.topItems} labelKey="item" valueKey="views" emptyMessage="Menu item views will appear when visitors open items." />
      </section>
    </>}
  </main>;
}

function AnalyticsSkeleton() {
  return <div className="analytics-skeleton" role="status" aria-label="Loading cafe analytics">
    <div className="admin-stats-grid analytics-stat-grid">{Array.from({ length: 3 }, (_, index) => <span className="skeleton shimmer analytics-skeleton-card" key={index} />)}</div>
    <span className="skeleton shimmer analytics-skeleton-chart" />
  </div>;
}
