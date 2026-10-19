import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import FilterBar from "../../components/analytics/FilterBar";
import LiveFeed from "../../components/analytics/LiveFeed";
import RankList from "../../components/analytics/RankList";
import StatCard from "../../components/analytics/StatCard";
import TrendChart from "../../components/analytics/TrendChart";
import "../../styles/admin/theme.css";
import "../../components/analytics/analytics.css";

const getFilters = (params) => ({
  range: params.get("from") && params.get("to") ? "custom" : params.get("range") || "7d",
  from: params.get("from") || "",
  to: params.get("to") || "",
  category: params.get("category") || "",
  area: params.get("area") || "",
  compare: params.get("compare") === "1",
});

function AnalyticsDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => getFilters(searchParams), [searchParams]);
  const [analytics, setAnalytics] = useState(null);
  const [live, setLive] = useState(null);
  const [loadedFilters, setLoadedFilters] = useState("");
  const [error, setError] = useState("");
  const filterKey = JSON.stringify(filters);
  const loading = loadedFilters !== filterKey;

  const changeFilters = useCallback((changes) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (key === "range" && value) {
        next.set("range", value);
        next.delete("from");
        next.delete("to");
      } else if (key === "range") {
        next.delete("range");
      } else if ((key === "from" || key === "to") && value) {
        next.set(key, value);
        next.delete("range");
      } else if (key === "compare") {
        if (value) next.set(key, "1");
        else next.delete(key);
      } else if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
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
    if (filters.category) params.set("category", filters.category);
    if (filters.area) params.set("area", filters.area);
    if (filters.compare) params.set("compare", "1");
    api.get(`/analytics/admin/overview?${params.toString()}`)
      .then(({ data }) => {
        if (!active) return;
        setAnalytics(data.analytics);
        setError("");
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.response?.data?.message || "Analytics could not be loaded.");
        setAnalytics(null);
      })
      .finally(() => {
        if (active) setLoadedFilters(filterKey);
      });
    return () => { active = false; };
  }, [filters, filterKey]);

  const daily = analytics?.daily || [];
  const totals = analytics?.totals || {};
  const growth = analytics?.comparison?.growth || {};
  const sparkline = (key) => daily.map((row) => ({ value: Number(row[key]) || 0 }));

  return (
    <main className="admin-page analytics-dashboard">
      <header className="admin-page-header">
        <div><span className="admin-analytics-eyebrow">ROOMSLIDER PERFORMANCE</span><h1>Analytics</h1><p>Live activity, listings and visitor trends.</p></div>
      </header>
      <FilterBar filters={filters} onChange={changeFilters} />
      {error && <div className="analytics-error" role="alert">{error}</div>}
      {filters.range === "live" ? (
        <section className="analytics-dashboard-section">
          {live && <div className="admin-stats-grid analytics-stat-grid">
            <StatCard label="Views today" value={live.totals.views} />
            <StatCard label="Calls today" value={live.totals.calls} />
            <StatCard label="WhatsApp today" value={live.totals.whatsapp} />
            <StatCard label="Signups today" value={live.totals.signups} />
            <StatCard label="Active now" value={live.activeNow} />
          </div>}
          {!live && <AnalyticsSkeleton />}
          <LiveFeed onUpdate={setLive} />
        </section>
      ) : loading ? <AnalyticsSkeleton /> : analytics && <>
        <section className="admin-stats-grid analytics-stat-grid">
          <StatCard label="Views" value={totals.views} growth={growth.views} sparkline={sparkline("views")} />
          <StatCard label="Calls" value={totals.calls} growth={growth.calls} sparkline={sparkline("calls")} />
          <StatCard label="WhatsApp" value={totals.whatsapp} growth={growth.whatsapp} sparkline={sparkline("whatsapp")} />
          <StatCard label="Conversion" value={totals.conversion} suffix="%" sparkline={sparkline("views")} />
          <StatCard label="Active now" value={analytics.activeNow} />
          <StatCard label="Signups" value={totals.signups} growth={growth.signups} sparkline={sparkline("signups")} />
        </section>
        <section className="admin-analytics-grid analytics-main-grid">
          <TrendChart data={daily} title="Activity trend" />
          <RankList title="Device split" rows={analytics.devices} labelKey="device" valueKey="count" />
          <RankList title="Source split" rows={analytics.sources} labelKey="source" valueKey="count" />
        </section>
        <section className="admin-analytics-grid analytics-main-grid">
          <RankList title="Top listings" rows={analytics.topListings} valueKey="views" />
          <RankList title="Views hain par contact nahi" rows={analytics.noContactListings} valueKey="views" emptyMessage="All viewed listings have received a contact." />
          <RankList title="Top searches" rows={analytics.topSearches} labelKey="query" valueKey="count" />
          <RankList title="Zero-result searches" rows={analytics.zeroResultSearches} labelKey="query" valueKey="count" />
          <RankList title="Top areas" rows={analytics.topAreas} labelKey="area" valueKey="views" />
          <RankList title="Top owners" rows={analytics.topOwners} labelKey="name" valueKey="views" />
          <RankList title="Views by category" rows={analytics.categoryViews} labelKey="category" valueKey="views" />
        </section>
        <p className="admin-analytics-note">Events are retained for 400 days. Date boundaries use India Standard Time.</p>
      </>}
    </main>
  );
}

function AnalyticsSkeleton() {
  return <div className="analytics-skeleton" role="status" aria-label="Loading analytics">
    <div className="admin-stats-grid analytics-stat-grid">{Array.from({ length: 6 }, (_, index) => <span className="skeleton shimmer analytics-skeleton-card" key={index} />)}</div>
    <span className="skeleton shimmer analytics-skeleton-chart" />
  </div>;
}

export default AnalyticsDashboard;
