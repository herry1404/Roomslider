import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const getBucket = (date, mode) => {
  const parsed = new Date(`${date}T00:00:00`);
  if (mode === "monthly") return {
    key: date.slice(0, 7),
    label: new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(parsed),
  };
  if (mode === "weekly") {
    const monday = new Date(parsed);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return {
      key: monday.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "2-digit" }).format(monday),
    };
  }
  return {
    key: date,
    label: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(parsed),
  };
};

export default function TrendChart({ data = [], series = [["views", "Views"], ["calls", "Calls"], ["whatsapp", "WhatsApp"]], title = "Activity trend" }) {
  const [interval, setInterval] = useState("daily");
  const chartData = useMemo(() => {
    const buckets = new Map();
    for (const row of data) {
      const { key, label } = getBucket(row.date, interval);
      const bucket = buckets.get(key) || { date: label };
      for (const [key] of series) bucket[key] = (Number(bucket[key]) || 0) + (Number(row[key]) || 0);
      buckets.set(key, bucket);
    }
    return [...buckets.values()];
  }, [data, interval, series]);

  return (
    <article className="admin-analytics-card analytics-trend-card">
      <header className="analytics-card-header">
        <h2>{title}</h2>
        <div className="analytics-chart-period" aria-label="Chart interval">
          {["daily", "weekly", "monthly"].map((value) => <button key={value} type="button" className={interval === value ? "selected" : ""} onClick={() => setInterval(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}
        </div>
      </header>
      {chartData.some((row) => series.some(([key]) => row[key] > 0)) ? (
        <div className="analytics-bar-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="var(--admin-border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--admin-muted)" tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis allowDecimals={false} stroke="var(--admin-muted)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--admin-card)", borderColor: "var(--admin-border)", color: "var(--admin-text)" }} />
              {series.map(([key, label], index) => <Bar key={key} dataKey={key} name={label} fill={index === 0 ? "var(--admin-accent)" : index === 1 ? "var(--admin-info)" : "var(--admin-warn)"} radius={[4, 4, 0, 0]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : <div className="admin-empty"><h3>No activity for this range</h3><p>Recorded analytics events will appear here.</p></div>}
    </article>
  );
}
