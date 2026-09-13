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
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import "../../styles/admin/dashboard.css";

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

function StatCard({ label, value, icon, accent }) {
  const count = useCountUp(value);

  return (
    <div className="dashboard-card" style={{ "--accent": accent }}>
      <div className="dashboard-card-icon">{icon}</div>
      <span>{label}</span>
      <h2>{count}</h2>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();

  // FIX: previous buttons pointed to routes that don't exist
  // (/admin/add-room, /admin/manage-rooms, /admin/manage-users) —
  // corrected to match the actual routes defined in App.jsx.
  const quickActions = [
    { label: "Add Room", icon: <HousePlus size={18} />, path: "/admin/rooms/add" },
    { label: "Manage Rooms", icon: <ClipboardList size={18} />, path: "/admin/rooms" },
    { label: "Manage Users", icon: <UserCog size={18} />, path: "/admin/users" },
    { label: "Analytics", icon: <BarChart3 size={18} />, action: () => alert("Analytics Coming Soon") },
  ];

  // NOTE: values are still hardcoded (0) — wiring these to real
  // counts from the backend is a separate pending task.
  return (
    <AdminLayout>
      <div className="dashboard">
        <div className="dashboard-top">
          <div>
            <h2>Dashboard Overview</h2>
            <p>Welcome to the RoomSlider Super Admin Panel 🚀</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <StatCard
            label="Total Rooms"
            value={0}
            icon={<Building2 size={18} />}
            accent="#3b82f6"
          />
          <StatCard
            label="Total Users"
            value={0}
            icon={<Users size={18} />}
            accent="#22c55e"
          />
          <StatCard
            label="Wishlist"
            value={0}
            icon={<Heart size={18} />}
            accent="#ec4899"
          />
          <StatCard
            label="Total Owners"
            value={0}
            icon={<UserCog size={18} />}
            accent="#a855f7"
          />
          <StatCard
            label="Pending Approvals"
            value={0}
            icon={<ClockAlert size={18} />}
            accent="#f97316"
          />
          <StatCard
            label="New Users This Week"
            value={0}
            icon={<TrendingUp size={18} />}
            accent="#06b6d4"
          />
        </div>

        {/* Recent Activity */}
        <div className="dashboard-section">
          <h3>Recent Activity</h3>
          <div className="activity-box">
            <p>No recent activity found.</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            {quickActions.map((item) => (
              <button
                key={item.label}
                onClick={() => (item.action ? item.action() : navigate(item.path))}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
