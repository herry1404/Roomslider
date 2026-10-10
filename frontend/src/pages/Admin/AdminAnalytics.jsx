import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Eye, Megaphone } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/admin/theme.css";

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/analytics")
      .then(({ data }) => setAnalytics(data.analytics))
      .catch((error) => toast.error(error.response?.data?.message || "Analytics could not be loaded"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <main className="admin-page"><p>Loading analytics...</p></main>;
  }

  if (!analytics) {
    return <main className="admin-page"><p>Analytics are currently unavailable.</p></main>;
  }

  const formatDay = (date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  return (
    <main className="admin-page admin-analytics">
      <header className="admin-page-header">
        <div>
          <h1>Analytics</h1>
          <p>Signups and listing searches over the past 30 days.</p>
        </div>
        <BarChart3 size={26} />
      </header>

      <div className="admin-stats-grid">
        <article className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Today&apos;s listing views</span>
            <Eye size={20} />
          </div>
          <h2 className="admin-stat-value">{(analytics.todayViews || 0).toLocaleString("en-IN")}</h2>
        </article>
        <article className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Push campaigns sent</span>
            <Megaphone size={20} />
          </div>
          <h2 className="admin-stat-value">{analytics.pushSentCount.toLocaleString("en-IN")}</h2>
        </article>
      </div>

      <section className="admin-analytics-grid">
        <article className="admin-analytics-card">
          <h2>Daily signups and searches</h2>
          <div className="admin-analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tickFormatter={formatDay} minTickGap={24} stroke="#94a3b8" />
                <YAxis allowDecimals={false} stroke="#94a3b8" />
                <Tooltip labelFormatter={formatDay} contentStyle={{ background: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
                <Line type="monotone" dataKey="signups" name="Signups" stroke="#34d399" strokeWidth={2} />
                <Line type="monotone" dataKey="searches" name="Searches" stroke="#38bdf8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-analytics-card">
          <h2>Top areas by listing count</h2>
          <div className="admin-analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topAreas} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" allowDecimals={false} stroke="#94a3b8" />
                <YAxis type="category" dataKey="area" width={110} stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
                <Bar dataKey="count" name="Listings" fill="#34d399" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-analytics-card">
          <h2>Listings by category</h2>
          <div className="admin-analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.listingsByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="category" stroke="#94a3b8" />
                <YAxis allowDecimals={false} stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
                <Bar dataKey="count" name="Listings" fill="#38bdf8" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </main>
  );
}

export default AdminAnalytics;
