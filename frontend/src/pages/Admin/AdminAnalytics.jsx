import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, BarChart3, Eye, Megaphone, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/admin/theme.css";

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get("/admin/analytics"),
      api.get("/admin/traffic", { params: { days: 30 } }),
    ]).then(([analyticsResult, trafficResult]) => {
      if (!active) return;
      if (analyticsResult.status === "fulfilled") setAnalytics(analyticsResult.value.data.analytics);
      else toast.error(analyticsResult.reason.response?.data?.message || "Analytics could not be loaded");
      if (trafficResult.status === "fulfilled") setTraffic(trafficResult.value.data.traffic);
      else toast.error(trafficResult.reason.response?.data?.message || "Site traffic could not be loaded");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
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
          <p>Today&apos;s visitors, traffic sources, and platform performance.</p>
        </div>
        <BarChart3 size={26} />
      </header>

      <div className="admin-stats-grid">
        <article className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Page views today</span>
            <Eye size={20} />
          </div>
          <h2 className="admin-stat-value">{(traffic?.summary.pageViews || 0).toLocaleString("en-IN")}</h2>
        </article>
        <article className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Unique sessions today</span>
            <Users size={20} />
          </div>
          <h2 className="admin-stat-value">{(traffic?.summary.uniqueVisitors || 0).toLocaleString("en-IN")}</h2>
        </article>
        <article className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Active in last 30 min</span>
            <Activity size={20} />
          </div>
          <h2 className="admin-stat-value">{(traffic?.summary.activeVisitors || 0).toLocaleString("en-IN")}</h2>
        </article>
        <article className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Listing views today</span>
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

      {traffic && (
        <section className="admin-analytics-grid" style={{ marginBottom: 18 }}>
          {!traffic.daily.some((day) => day.pageViews > 0) && (
            <p className="admin-analytics-card admin-traffic-note">
              Traffic reporting starts with this update, so earlier site visits are not available in these charts.
            </p>
          )}
          <article className="admin-analytics-card">
            <h2>Website traffic · last 30 days</h2>
            <div className="admin-analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={traffic.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tickFormatter={formatDay} minTickGap={24} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip labelFormatter={formatDay} contentStyle={{ background: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
                  <Line type="monotone" dataKey="pageViews" name="Page views" stroke="#38bdf8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="uniqueVisitors" name="Unique sessions" stroke="#34d399" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
          <article className="admin-analytics-card">
            <h2>Traffic by source</h2>
            <div className="admin-analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={traffic.sources} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" allowDecimals={false} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="source" width={110} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
                  <Bar dataKey="pageViews" name="Page views" fill="#a78bfa" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
          <article className="admin-analytics-card">
            <h2>Visitors by platform</h2>
            <div className="admin-analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={traffic.platforms}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="platform" stroke="#94a3b8" />
                  <YAxis allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
                  <Bar dataKey="pageViews" name="Page views" fill="#38bdf8" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
          <article className="admin-analytics-card admin-traffic-pages">
            <h2>Top pages</h2>
            {traffic.topPages.length ? traffic.topPages.map((page) => (
              <div className="admin-traffic-page" key={page.path}>
                <span>{page.path === "/" ? "Home" : page.path}</span>
                <strong>{page.pageViews.toLocaleString("en-IN")}</strong>
              </div>
            )) : <p>No website visits recorded in this period.</p>}
          </article>
        </section>
      )}

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
