import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  ClipboardList,
  ExternalLink,
  Home,
  HousePlus,
  LineChart,
  Megaphone,
  RefreshCw,
  Users,
} from "lucide-react";
import api from "../../api/axios";
import cafes from "../../data/cafes";
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

function getAdStatus(ad) {
  if (!ad.active) return "Paused";
  const now = Date.now();
  if (ad.startsAt && new Date(ad.startsAt).getTime() > now) return "Scheduled";
  if (ad.endsAt && new Date(ad.endsAt).getTime() <= now) return "Expired";
  return "Live";
}

function getAdAudience(ad) {
  if (ad.targetBy === "location") return `Location · ${ad.location || "—"}`;
  if (ad.targetBy === "all" || ad.cafe === "all") return "All cafes";
  const cafeIds = ad.cafes?.length ? ad.cafes : [ad.cafe].filter(Boolean);
  const names = cafeIds.map((id) => (
    cafes.find((cafe) => cafe.id === id || (id === "htlcafe" && cafe.id === "htl-cafe"))?.name || id
  ));
  return names.join(", ") || "Cafe";
}

function CafeAdsDashboard() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAds = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/promo-listings/admin");
      setAds(Array.isArray(data.ads) ? data.ads : []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Cafe ads could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.get("/promo-listings/admin")
      .then(({ data }) => {
        if (active) {
          setAds(Array.isArray(data.ads) ? data.ads : []);
          setError("");
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Cafe ads could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const liveCount = useMemo(() => ads.filter((ad) => getAdStatus(ad) === "Live").length, [ads]);
  const dashboardAds = ads.slice(0, 4);

  return (
    <section className="dashboard-section dashboard-ads" aria-labelledby="dashboard-ads-title">
      <div className="dashboard-section-heading">
        <div>
          <h3 id="dashboard-ads-title">Cafe ads</h3>
          <p>{liveCount} live · {ads.length} total</p>
        </div>
        <Link className="admin-btn secondary dashboard-ads-manage" to="/admin/ads">
          Manage ads <ExternalLink size={15} />
        </Link>
      </div>
      {loading ? (
        <p className="dashboard-ads-state">Loading cafe ads…</p>
      ) : error ? (
        <div className="dashboard-ads-state" role="alert">
          <p>{error}</p>
          <button type="button" className="admin-btn secondary" onClick={fetchAds}>
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      ) : dashboardAds.length === 0 ? (
        <div className="dashboard-ads-state">
          <Megaphone size={22} />
          <p>No cafe ads have been added yet. Create and manage ads from Cafe Ads.</p>
        </div>
      ) : (
        <div className="dashboard-ads-grid">
          {dashboardAds.map((ad) => {
            const image = ad.slot === "top" ? ad.logoUrl : ad.imageUrl;
            const status = getAdStatus(ad);
            return (
              <article className="dashboard-ad-card" key={ad._id}>
                <div className={`dashboard-ad-image ${ad.slot === "bottom" ? "banner" : ""}`}>
                  {image && <img src={image} alt="" loading="lazy" />}
                </div>
                <div className="dashboard-ad-copy">
                  <span className={`dashboard-ad-status ${status === "Live" ? "is-live" : ""}`}>
                    <i /> {status} · {ad.slot === "top" ? "Top ad" : "Bottom ad"}
                  </span>
                  <strong>{ad.text}</strong>
                  <small>{getAdAudience(ad)}</small>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
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

      <CafeAdsDashboard />

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
