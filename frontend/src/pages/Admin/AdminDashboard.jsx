import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  Heart,
  UserCog,
  HousePlus,
  ClipboardList,
  BarChart3,
  ClockAlert,
  TrendingUp,
  Eye,
  Wallet,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import api from "../../api/axios";
import "../../styles/admin/theme.css";
import "../../styles/admin/dashboard.css";
import RecentActivity from "./RecentActivity";

// Small reusable hook: animates a number counting up from 0 to
// `target` whenever `target` changes, giving stat cards a "live"
// high-tech feel instead of numbers just appearing statically.
function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = null;
    const from = 0;
    const to = Number(target) || 0;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.floor(from + (to - from) * progress));
      if (progress < 1) requestAnimationFrame(step);
      else setValue(to);
    };

    requestAnimationFrame(step);
  }, [target, duration]);

  return value;
}

function StatCard({ label, value, icon, accent, prefix = "" }) {
  const count = useCountUp(value);

  return (
    <div className="admin-stat-card">
      <div className="admin-stat-top">
        <span className="admin-stat-label">{label}</span>
        <div
          className="admin-stat-icon"
          style={{ color: accent, background: `${accent}22` }}
        >
          {icon}
        </div>
      </div>
      <h2 className="admin-stat-value">
        {prefix}
        {count.toLocaleString("en-IN")}
      </h2>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalRooms: 0,
    totalUsers: 0,
    totalOwners: 0,
    totalWishlist: 0,
    newUsersThisWeek: 0,
    totalViews: 0,
    totalEarnings: 0,
    listingsGrowth: [],
    localityDemand: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/dashboard");
        setStats((prev) => ({ ...prev, ...res.data.stats }));
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };
    fetchStats();
  }, []);

  const quickActions = [
    { label: "Add Room", icon: <HousePlus size={18} />, path: "/admin/rooms/add" },
    { label: "Manage Rooms", icon: <ClipboardList size={18} />, path: "/admin/rooms" },
    { label: "Manage Users", icon: <UserCog size={18} />, path: "/admin/users" },
    { label: "Analytics", icon: <BarChart3 size={18} />, action: () => alert("Analytics Coming Soon") },
  ];

  return (
    <div className="admin-page dashboard-page">
      <div className="admin-page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Welcome to the RoomSlider Super Admin Panel 🚀</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <StatCard label="Total Rooms" value={stats.totalRooms} icon={<Building2 size={18} />} accent="#3b82f6" />
        <StatCard label="Total Users" value={stats.totalUsers} icon={<Users size={18} />} accent="#22c55e" />
        <StatCard label="Wishlist" value={stats.totalWishlist} icon={<Heart size={18} />} accent="#ec4899" />
        <StatCard label="Total Owners" value={stats.totalOwners} icon={<UserCog size={18} />} accent="#a855f7" />
        <StatCard label="Pending Approvals" value={0} icon={<ClockAlert size={18} />} accent="#f97316" />
        <StatCard label="New Users This Week" value={stats.newUsersThisWeek} icon={<TrendingUp size={18} />} accent="#06b6d4" />
        <StatCard label="Total Views" value={stats.totalViews} icon={<Eye size={18} />} accent="#3b82f6" />
        <StatCard label="Total Earnings" value={stats.totalEarnings} icon={<Wallet size={18} />} accent="#22c55e" prefix="₹" />
      </div>

      {/* Listings Growth */}
      <div className="dashboard-section">
        <h3>Listings Growth</h3>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={stats.listingsGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
              <XAxis dataKey="month" stroke="var(--admin-muted)" fontSize={12} />
              <YAxis stroke="var(--admin-muted)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--admin-card)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: 10,
                  color: "var(--admin-text)",
                }}
              />
              <Line type="monotone" dataKey="total" stroke="var(--admin-accent)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Demand by Locality */}
      <div className="dashboard-section">
        <h3>Demand by Locality</h3>
        {stats.localityDemand.length === 0 ? (
          <div className="admin-empty">
            <p>No listings yet to show locality demand.</p>
          </div>
        ) : (
          <div style={{ width: "100%", height: Math.max(stats.localityDemand.length * 40 + 40, 160) }}>
            <ResponsiveContainer>
              <BarChart data={stats.localityDemand} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                <XAxis type="number" stroke="var(--admin-muted)" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="locality" stroke="var(--admin-muted)" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    background: "var(--admin-card)",
                    border: "1px solid var(--admin-border)",
                    borderRadius: 10,
                    color: "var(--admin-text)",
                  }}
                />
                <Bar dataKey="count" fill="var(--admin-accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section">
        <h3>Recent Activity</h3>
        <RecentActivity />
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h3>Quick Actions</h3>
        <div className="quick-actions">
          {quickActions.map((item) => (
            <button
              key={item.label}
              className="admin-btn secondary qa-btn"
              onClick={() => (item.action ? item.action() : navigate(item.path))}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
