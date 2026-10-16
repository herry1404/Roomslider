import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  ClipboardList,
  Home,
  HousePlus,
  LineChart,
  Megaphone,
  Users,
} from "lucide-react";
import api from "../../api/axios";
import "../../styles/admin/theme.css";
import "../../styles/admin/dashboard.css";
import RecentActivity from "./RecentActivity";

function StatCard({ label, value, icon, accent }) {
  return (
    <article className="admin-stat-card">
      <div className="admin-stat-top">
        <span className="admin-stat-label">{label}</span>
        <span className="admin-stat-icon" style={{ color: accent, background: `${accent}22` }}>{icon}</span>
      </div>
      <strong className="admin-stat-value">{(Number(value) || 0).toLocaleString("en-IN")}</strong>
    </article>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalRooms: 0, totalUsers: 0 });

  useEffect(() => {
    let active = true;
    api.get("/admin/dashboard")
      .then(({ data }) => {
        if (active) setStats((current) => ({ ...current, ...data.stats }));
      })
      .catch((error) => console.error("Dashboard fetch error:", error));
    return () => { active = false; };
  }, []);

  const quickActions = [
    { label: "Add Room", icon: <HousePlus size={18} />, path: "/admin/rooms/add" },
    { label: "Manage Rooms", icon: <ClipboardList size={18} />, path: "/admin/rooms" },
    { label: "Manage Users", icon: <Users size={18} />, path: "/admin/users" },
    { label: "Cafe Ads", icon: <Megaphone size={18} />, path: "/admin/ads" },
    { label: "Notifications", icon: <Megaphone size={18} />, path: "/admin/notifications" },
  ];

  return (
    <main className="admin-page dashboard-page">
      <header className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>RoomSlider ko manage karne ke shortcuts aur basic numbers.</p>
        </div>
        <button className="admin-btn secondary" onClick={() => navigate("/")}>
          <Home size={18} />
          Visit Home
        </button>
      </header>

      <Link to="/admin/analytics" className="dashboard-analytics-link">
        <span className="dashboard-analytics-icon"><LineChart size={26} /></span>
        <span><strong>Analytics dekhein</strong><small>Site visits, cafe menus aur listings ka poora hisaab</small></span>
        <BarChart3 size={22} aria-hidden="true" />
      </Link>

      <div className="admin-stats-grid dashboard-stats">
        <StatCard label="Room listings" value={stats.totalRooms} icon={<Building2 size={18} />} accent="#a78bfa" />
        <StatCard label="Site users" value={stats.totalUsers} icon={<Users size={18} />} accent="#34d399" />
      </div>

      <div className="dashboard-columns dashboard-lower">
        <section className="dashboard-section">
          <h2>Recent admin activity</h2>
          <RecentActivity />
        </section>
        <section className="dashboard-section">
          <h2>Quick actions</h2>
          <div className="quick-actions">
            {quickActions.map((item) => (
              <button key={item.label} className="admin-btn secondary qa-btn" onClick={() => navigate(item.path)}>
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default AdminDashboard;
