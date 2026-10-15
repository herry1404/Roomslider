import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Building2,
  ClipboardList,
  Eye,
  Home,
  HousePlus,
  Megaphone,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../api/axios";
import "../../styles/admin/theme.css";
import "../../styles/admin/dashboard.css";
import RecentActivity from "./RecentActivity";

function StatCard({ label, value, icon, accent }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-top">
        <span className="admin-stat-label">{label}</span>
        <div className="admin-stat-icon" style={{ color: accent, background: `${accent}22` }}>
          {icon}
        </div>
      </div>
      <h2 className="admin-stat-value">{(Number(value) || 0).toLocaleString("en-IN")}</h2>
    </div>
  );
}

const formatDay = (date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
  day: "numeric",
  month: "short",
});
const PIE_COLORS = ["#34d399", "#38bdf8", "#a78bfa", "#f59e0b", "#fb7185", "#22d3ee"];

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalRooms: 0, totalUsers: 0 });
  const [traffic, setTraffic] = useState(null);
  const [cafe, setCafe] = useState(null);

  useEffect(() => {
    let active = true;
    api.get("/admin/dashboard")
      .then(({ data }) => {
        if (active) setStats((current) => ({ ...current, ...data.stats }));
      })
      .catch((error) => console.error("Dashboard fetch error:", error));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const refreshTraffic = async () => {
      try {
        const { data } = await api.get("/admin/traffic", { params: { days: 7 } });
        if (active) setTraffic(data.traffic);
      } catch (error) {
        console.error("Live traffic fetch error:", error);
      }
    };
    refreshTraffic();
    const intervalId = window.setInterval(refreshTraffic, 60_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/ads/admin/analytics", { params: { days: 7 } })
      .then(({ data }) => {
        if (active) setCafe(data.analytics);
      })
      .catch((error) => console.error("Cafe dashboard analytics fetch error:", error));
    return () => {
      active = false;
    };
  }, []);

  const quickActions = [
    { label: "Add Room", icon: <HousePlus size={18} />, path: "/admin/rooms/add" },
    { label: "Manage Rooms", icon: <ClipboardList size={18} />, path: "/admin/rooms" },
    { label: "Manage Users", icon: <Users size={18} />, path: "/admin/users" },
    { label: "Cafe Ads", icon: <Megaphone size={18} />, path: "/admin/ads" },
    { label: "Ads Analytics", icon: <BarChart3 size={18} />, path: "/admin/analytics#cafe-ads" },
    { label: "Notifications", icon: <Megaphone size={18} />, path: "/admin/notifications" },
    { label: "All Analytics", icon: <BarChart3 size={18} />, path: "/admin/analytics" },
  ];

  return (
    <div className="admin-page dashboard-page">
      <div className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>A clear snapshot of RoomSlider activity and operations.</p>
        </div>
        <button className="admin-btn secondary" onClick={() => navigate("/")}>
          <Home size={18} />
          Visit Home
        </button>
      </div>

      <section className="dashboard-live" aria-label="Live site traffic">
        <div className="dashboard-live-heading">
          <div>
            <span className="dashboard-live-indicator"><i /> LIVE SITE TRAFFIC</span>
            <h2>Today at a glance</h2>
          </div>
          <span className="dashboard-updated">
            {traffic?.updatedAt
              ? `Updated ${new Date(traffic.updatedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`
              : "Waiting for traffic"}
          </span>
        </div>
        <div className="admin-stats-grid dashboard-stats">
          <StatCard label="Page views today" value={traffic?.summary.pageViews} icon={<Eye size={18} />} accent="#38bdf8" />
          <StatCard label="Unique sessions today" value={traffic?.summary.uniqueVisitors} icon={<Users size={18} />} accent="#22c55e" />
          <StatCard label="Active in last 30 min" value={traffic?.summary.activeVisitors} icon={<Activity size={18} />} accent="#f59e0b" />
          <StatCard label="Room listings" value={stats.totalRooms} icon={<Building2 size={18} />} accent="#a78bfa" />
          <StatCard label="Cafe menu views · 7 days" value={cafe?.summary.menuViews} icon={<Megaphone size={18} />} accent="#34d399" />
          <StatCard label="Cafe ad clicks · 7 days" value={cafe?.summary.adClicks} icon={<Eye size={18} />} accent="#fb7185" />
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-section dashboard-traffic-chart">
          <div className="dashboard-section-heading">
            <div><h3>Visitor trend</h3><p>Daily page views and unique sessions · last 7 days</p></div>
          </div>
          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={traffic?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                <XAxis dataKey="date" tickFormatter={formatDay} minTickGap={20} stroke="var(--admin-muted)" fontSize={11} />
                <YAxis allowDecimals={false} stroke="var(--admin-muted)" fontSize={11} />
                <Tooltip
                  labelFormatter={formatDay}
                  contentStyle={{
                    background: "var(--admin-card)",
                    border: "1px solid var(--admin-border)",
                    borderRadius: 10,
                    color: "var(--admin-text)",
                  }}
                />
                <Line type="monotone" dataKey="pageViews" name="Page views" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="uniqueVisitors" name="Unique sessions" stroke="#34d399" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="dashboard-traffic-breakdown">
            <div>
              <strong>Top source</strong>
              <span>{traffic?.sources?.[0]?.source || "No traffic yet"}</span>
            </div>
            <div>
              <strong>Top platform</strong>
              <span>{traffic?.platforms?.[0]?.platform || "No traffic yet"}</span>
            </div>
            <div>
              <strong>Total users</strong>
              <span>{(stats.totalUsers || 0).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </section>

        <section className="dashboard-section dashboard-visitor-feed">
          <div className="dashboard-section-heading">
            <div><h3>Recent page visits</h3><p>Latest anonymous activity</p></div>
            <button type="button" className="dashboard-text-link" onClick={() => navigate("/admin/analytics")}>Full analytics</button>
          </div>
          {traffic?.recent?.length ? (
            <div className="dashboard-visits">
              {traffic.recent.slice(0, 8).map((visit, index) => (
                <div className="dashboard-visit" key={`${visit.createdAt}-${visit.path}-${index}`}>
                  <span className="dashboard-visit-icon"><Eye size={15} /></span>
                  <div className="dashboard-visit-info">
                    <strong>{visit.path === "/" ? "Home" : visit.path}</strong>
                    <small>{visit.source} · {visit.platform}</small>
                  </div>
                  <time dateTime={visit.createdAt}>
                    {new Date(visit.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-visits-empty">Page visits will appear here as people browse the site.</div>
          )}
        </section>
      </div>

      <section className="dashboard-section dashboard-cafe-overview">
        <div className="dashboard-section-heading">
          <div><h3>Cafe ads · last 7 days</h3><p>Menu views and audience breakdown</p></div>
          <button type="button" className="dashboard-text-link" onClick={() => navigate("/admin/analytics#cafe-ads")}>View ad analytics</button>
        </div>
        <div className="dashboard-cafe-grid">
          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cafe?.dailyViews || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                <XAxis dataKey="date" tickFormatter={formatDay} minTickGap={20} stroke="var(--admin-muted)" fontSize={11} />
                <YAxis allowDecimals={false} stroke="var(--admin-muted)" fontSize={11} />
                <Tooltip
                  labelFormatter={formatDay}
                  contentStyle={{
                    background: "var(--admin-card)",
                    border: "1px solid var(--admin-border)",
                    borderRadius: 10,
                    color: "var(--admin-text)",
                  }}
                />
                <Line type="monotone" dataKey="views" name="Menu views" stroke="#34d399" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="uniqueVisitors" name="Unique sessions" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="dashboard-cafe-pie">
            <h4>Visitors by platform</h4>
            {cafe?.byPlatform?.some((item) => item.views > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={cafe.byPlatform} dataKey="views" nameKey="platform" innerRadius={48} outerRadius={76} paddingAngle={3}>
                    {cafe.byPlatform.map((item, index) => <Cell key={item.platform} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--admin-card)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="dashboard-visits-empty">Cafe traffic will appear here.</p>}
          </div>
        </div>
      </section>

      <div className="dashboard-columns dashboard-lower">
        <section className="dashboard-section">
          <h3>Recent admin activity</h3>
          <RecentActivity />
        </section>
        <section className="dashboard-section">
          <h3>Quick actions</h3>
          <div className="quick-actions">
            {quickActions.map((item) => (
              <button
                key={item.label}
                className="admin-btn secondary qa-btn"
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
