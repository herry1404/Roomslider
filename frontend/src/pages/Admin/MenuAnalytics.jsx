import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import FilterBar from "../../components/analytics/FilterBar";
import RankList from "../../components/analytics/RankList";
import StatCard from "../../components/analytics/StatCard";
import TrendChart from "../../components/analytics/TrendChart";
import cafes from "../../data/cafes";
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

const cafeNames = new Map(cafes.flatMap((cafe) => [
  [cafe.id.toLowerCase(), cafe.name],
  [cafe.id.replaceAll("-", "").toLowerCase(), cafe.name],
]));

const cafeName = (id) => cafeNames.get(String(id).toLowerCase())
  || cafeNames.get(String(id).replaceAll("-", "").toLowerCase())
  || id
  || "Unknown cafe";

export default function MenuAnalytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const filterKey = JSON.stringify(filters);
  const [analytics, setAnalytics] = useState(null);
  const [loadedFilters, setLoadedFilters] = useState("");
  const [error, setError] = useState("");
  const loading = loadedFilters !== filterKey;

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
    } else {
      params.set("range", filters.range === "live" ? "today" : filters.range);
    }
    if (filters.compare) params.set("compare", "1");
    api.get(`/analytics/menus/overview?${params}`)
      .then(({ data }) => {
        if (!active) return;
        setAnalytics(data.analytics);
        setError("");
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.response?.data?.message || "Direct menu analytics could not be loaded.");
        setAnalytics(null);
      })
      .finally(() => {
        if (active) setLoadedFilters(filterKey);
      });
    return () => { active = false; };
  }, [filters, filterKey]);

  const cafeRows = (analytics?.cafes || []).map((row) => ({
    ...row,
    name: cafeName(row.cafeId),
  }));
  const locationRows = (analytics?.locations || []).map((row) => ({
    ...row,
    location: row.location || "Unknown location",
  }));
  const cafeLocationRows = analytics?.cafeLocations || [];

  return <main className="admin-page analytics-dashboard">
    <header className="admin-page-header">
      <div>
        <Link to="/admin/cafe-menus" className="analytics-back-link">← Cafe menus</Link>
        <span className="admin-analytics-eyebrow">DIRECT MENU TRAFFIC</span>
        <h1>Menu Analytics</h1>
        <p>Direct visits to public cafe menus, grouped by cafe and location.</p>
      </div>
    </header>
    <FilterBar filters={filters} onChange={changeFilters} hideCategoryArea />
    {error && <div className="analytics-error" role="alert">{error}</div>}
    {loading ? <AnalyticsSkeleton /> : analytics && <>
      <section className="admin-stats-grid analytics-stat-grid">
        <StatCard
          label="Direct menu views"
          value={analytics.totals.views}
          growth={analytics.comparison?.growth?.views}
          sparkline={analytics.daily.map((row) => ({ value: row.views }))}
        />
        <StatCard label="Cafes with views" value={cafeRows.length} />
        <StatCard label="Locations with views" value={locationRows.length} />
      </section>
      <section className="admin-analytics-grid analytics-main-grid">
        <TrendChart title="Direct menu views per day" data={analytics.daily} series={[["views", "Direct menu views"]]} />
        <RankList title="Views by cafe" rows={cafeRows} labelKey="name" valueKey="views" emptyMessage="Direct menu views will appear here." />
        <RankList title="Views by location" rows={locationRows} labelKey="location" valueKey="views" emptyMessage="Location breakdown will appear here." />
      </section>
      <section className="admin-analytics-card analytics-menu-table-card">
        <header className="analytics-card-header"><h2>Cafe and location breakdown</h2></header>
        {cafeLocationRows.length ? <div className="analytics-menu-table-wrap">
          <table className="analytics-menu-table">
            <thead><tr><th scope="col">Cafe</th><th scope="col">Location</th><th scope="col">Direct views</th></tr></thead>
            <tbody>{cafeLocationRows.map((row, index) => <tr key={`${row.cafeId}-${row.location}-${index}`}>
              <td data-label="Cafe">{cafeName(row.cafeId)}</td>
              <td data-label="Location">{row.location || "Unknown location"}</td>
              <td data-label="Direct views">{Number(row.views).toLocaleString("en-IN")}</td>
            </tr>)}</tbody>
          </table>
        </div> : <div className="admin-empty"><h3>No direct menu views</h3><p>Views will be grouped by cafe and location once visitors open a menu directly.</p></div>}
      </section>
    </>}
  </main>;
}

function AnalyticsSkeleton() {
  return <div className="analytics-skeleton" role="status" aria-label="Loading direct menu analytics">
    <div className="admin-stats-grid analytics-stat-grid">{Array.from({ length: 3 }, (_, index) => <span className="skeleton shimmer analytics-skeleton-card" key={index} />)}</div>
    <span className="skeleton shimmer analytics-skeleton-chart" />
  </div>;
}
