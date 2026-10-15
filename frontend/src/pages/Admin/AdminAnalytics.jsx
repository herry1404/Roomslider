import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Eye,
  Megaphone,
  MousePointerClick,
  Search,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/admin/theme.css";

const PIE_COLORS = ["#34d399", "#38bdf8", "#a78bfa", "#f59e0b", "#fb7185", "#22d3ee", "#c084fc", "#f97316"];
const chartStyle = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 10,
  color: "#f8fafc",
};

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <article className="admin-stat-card">
      <div className="admin-stat-top">
        <span className="admin-stat-label">{label}</span>
        <span className="admin-stat-icon" style={{ color: accent, background: `${accent}22` }}><Icon size={18} /></span>
      </div>
      <h2 className="admin-stat-value">{typeof value === "string" ? value : (Number(value) || 0).toLocaleString("en-IN")}</h2>
    </article>
  );
}

function PieCard({ title, data, nameKey, valueKey }) {
  const rows = (data || []).filter((item) => Number(item[valueKey]) > 0);
  return (
    <article className="admin-analytics-card">
      <h2>{title}</h2>
      {rows.length ? (
        <div className="admin-analytics-chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={rows} dataKey={valueKey} nameKey={nameKey} innerRadius={58} outerRadius={94} paddingAngle={3}>
                {rows.map((item, index) => <Cell key={`${item[nameKey]}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={chartStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : <p className="admin-analytics-empty">No data recorded for this period yet.</p>}
    </article>
  );
}

const formatDay = (date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
  day: "numeric",
  month: "short",
});

const aggregateCafeViews = (rows, key) => Object.values((rows || []).reduce((result, row) => {
  const label = row[key] || "Unknown";
  result[label] = result[label] || { [key]: label, views: 0 };
  result[label].views += Number(row.views) || 0;
  return result;
}, {})).sort((left, right) => right.views - left.views).slice(0, 8);

function AdminAnalytics() {
  const { hash } = useLocation();
  const [analytics, setAnalytics] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get("/admin/analytics"),
      api.get("/admin/traffic", { params: { days: 30 } }),
      api.get("/ads/admin/analytics", { params: { days: 30 } }),
    ]).then(([analyticsResult, trafficResult, cafeResult]) => {
      if (!active) return;
      if (analyticsResult.status === "fulfilled") setAnalytics(analyticsResult.value.data.analytics);
      else toast.error(analyticsResult.reason.response?.data?.message || "Site analytics could not be loaded");
      if (trafficResult.status === "fulfilled") setTraffic(trafficResult.value.data.traffic);
      else toast.error(trafficResult.reason.response?.data?.message || "Visitor analytics could not be loaded");
      if (cafeResult.status === "fulfilled") setCafe(cafeResult.value.data.analytics);
      else toast.error(cafeResult.reason.response?.data?.message || "Cafe ad analytics could not be loaded");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loading || hash !== "#cafe-ads") return;
    document.getElementById("cafe-ads")?.scrollIntoView({ behavior: "smooth" });
  }, [hash, loading]);

  if (loading) return <main className="admin-page"><p>Loading analytics…</p></main>;
  if (!analytics && !traffic && !cafe) {
    return <main className="admin-page"><p>Analytics are temporarily unavailable.</p></main>;
  }

  const sourceData = traffic?.sources || [];
  const platformData = traffic?.platforms || [];

  return (
    <main className="admin-page admin-analytics">
      <header className="admin-page-header">
        <div>
          <span className="admin-analytics-eyebrow"><BarChart3 size={14} /> PERFORMANCE OVERVIEW</span>
          <h1>All analytics</h1>
          <p>Website, listings, cafe menus, and ad performance · last 30 days.</p>
        </div>
      </header>

      {traffic && (
        <section className="admin-analytics-section">
          <div className="admin-analytics-section-heading"><div><h2>Website traffic</h2><p>Audience and activity across RoomSlider.</p></div></div>
          <div className="admin-stats-grid">
            <StatCard label="Page views today" value={traffic.summary.pageViews} icon={Eye} accent="#38bdf8" />
            <StatCard label="Unique sessions today" value={traffic.summary.uniqueVisitors} icon={Users} accent="#34d399" />
            <StatCard label="Active in last 30 min" value={traffic.summary.activeVisitors} icon={Activity} accent="#f59e0b" />
            <StatCard label="Listing views today" value={analytics?.todayViews} icon={Eye} accent="#a78bfa" />
          </div>
          {!traffic.daily.some((day) => day.pageViews > 0) && (
            <p className="admin-analytics-note">Traffic reporting starts with this update; earlier visits are not available in these charts.</p>
          )}
          <div className="admin-analytics-grid">
            <article className="admin-analytics-card admin-analytics-card-wide">
              <h2>Daily visits</h2>
              <div className="admin-analytics-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={traffic.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tickFormatter={formatDay} minTickGap={24} stroke="#94a3b8" />
                    <YAxis allowDecimals={false} stroke="#94a3b8" />
                    <Tooltip labelFormatter={formatDay} contentStyle={chartStyle} />
                    <Legend />
                    <Line type="monotone" dataKey="pageViews" name="Page views" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="uniqueVisitors" name="Unique sessions" stroke="#34d399" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>
            <PieCard title="Traffic sources" data={sourceData} nameKey="source" valueKey="pageViews" />
            <PieCard title="Visitors by platform" data={platformData} nameKey="platform" valueKey="pageViews" />
            <article className="admin-analytics-card">
              <h2>Top pages</h2>
              {(traffic.topPages || []).length ? traffic.topPages.map((page) => (
                <div className="admin-traffic-page" key={page.path}>
                  <span>{page.path === "/" ? "Home" : page.path}</span>
                  <strong>{Number(page.pageViews || 0).toLocaleString("en-IN")}</strong>
                </div>
              )) : <p className="admin-analytics-empty">No website visits recorded in this period.</p>}
            </article>
          </div>
        </section>
      )}

      {analytics && (
        <section className="admin-analytics-section">
          <div className="admin-analytics-section-heading"><div><h2>Listings and discovery</h2><p>Search activity, signups, and listing mix.</p></div></div>
          <div className="admin-stats-grid">
            <StatCard label="Push campaigns sent" value={analytics.pushSentCount} icon={Megaphone} accent="#f59e0b" />
            <StatCard
              label="New signups · 30 days"
              value={analytics.dailyActivity.reduce((sum, day) => sum + day.signups, 0)}
              icon={Users}
              accent="#34d399"
            />
            <StatCard
              label="Searches · 30 days"
              value={analytics.dailyActivity.reduce((sum, day) => sum + day.searches, 0)}
              icon={Search}
              accent="#38bdf8"
            />
          </div>
          <div className="admin-analytics-grid">
            <article className="admin-analytics-card admin-analytics-card-wide">
              <h2>Daily signups and searches</h2>
              <div className="admin-analytics-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tickFormatter={formatDay} minTickGap={24} stroke="#94a3b8" />
                    <YAxis allowDecimals={false} stroke="#94a3b8" />
                    <Tooltip labelFormatter={formatDay} contentStyle={chartStyle} />
                    <Legend />
                    <Line type="monotone" dataKey="signups" name="Signups" stroke="#34d399" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="searches" name="Searches" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>
            <PieCard title="Listings by category" data={analytics.listingsByCategory} nameKey="category" valueKey="count" />
            <PieCard title="Top listing areas" data={analytics.topAreas} nameKey="area" valueKey="count" />
          </div>
        </section>
      )}

      {cafe && (
        <section className="admin-analytics-section" id="cafe-ads">
          <div className="admin-analytics-section-heading"><div><h2>Cafe ads and menu analytics</h2><p>Reach, engagement, and cafe audience.</p></div></div>
          <div className="admin-stats-grid">
            <StatCard label="Menu views" value={cafe.summary.menuViews} icon={Eye} accent="#34d399" />
            <StatCard label="Unique sessions" value={cafe.summary.uniqueVisitors} icon={Users} accent="#38bdf8" />
            <StatCard label="Ad impressions" value={cafe.summary.adImpressions} icon={Megaphone} accent="#a78bfa" />
            <StatCard label="Ad clicks" value={cafe.summary.adClicks} icon={MousePointerClick} accent="#f59e0b" />
            <StatCard label="Ad click rate" value={`${cafe.summary.clickRate || 0}%`} icon={Activity} accent="#fb7185" />
          </div>
          <div className="admin-analytics-grid">
            <article className="admin-analytics-card admin-analytics-card-wide">
              <h2>Daily cafe menu views</h2>
              <div className="admin-analytics-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cafe.dailyViews || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tickFormatter={formatDay} minTickGap={24} stroke="#94a3b8" />
                    <YAxis allowDecimals={false} stroke="#94a3b8" />
                    <Tooltip labelFormatter={formatDay} contentStyle={chartStyle} />
                    <Legend />
                    <Line type="monotone" dataKey="views" name="Menu views" stroke="#34d399" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="uniqueVisitors" name="Unique sessions" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>
            <PieCard title="Menu views by cafe" data={aggregateCafeViews(cafe.byCafe, "cafe")} nameKey="cafe" valueKey="views" />
            <PieCard title="Menu views by location" data={cafe.byLocation} nameKey="location" valueKey="views" />
            <PieCard title="Cafe traffic sources" data={cafe.bySource} nameKey="source" valueKey="views" />
            <PieCard title="Cafe visitors by platform" data={cafe.byPlatform} nameKey="platform" valueKey="views" />
            <article className="admin-analytics-card">
              <h2>Ad performance</h2>
              {(cafe.adPerformance || []).length ? (
                <div className="admin-analytics-table-wrap">
                  <table className="admin-analytics-table">
                    <thead><tr><th>Ad</th><th>Impressions</th><th>Clicks</th><th>CTR</th></tr></thead>
                    <tbody>{cafe.adPerformance.map((row) => (
                      <tr key={`${row.adId}-${row.cafe}-${row.location}`}>
                        <td>{row.text}<small>{row.cafe} · {row.location}</small></td>
                        <td>{Number(row.impressions || 0).toLocaleString("en-IN")}</td>
                        <td>{Number(row.clicks || 0).toLocaleString("en-IN")}</td>
                        <td>{row.clickRate || 0}%</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : <p className="admin-analytics-empty">Ad impressions and clicks will appear here as people view cafe menus.</p>}
            </article>
          </div>
        </section>
      )}
    </main>
  );
}

export default AdminAnalytics;
