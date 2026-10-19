import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDown, ArrowUp } from "lucide-react";
import useCountUp from "../../hooks/useCountUp";

export default function StatCard({ label, value = 0, growth, suffix = "", sparkline = [] }) {
  const count = useCountUp(value);
  const positive = Number(growth) >= 0;
  const hasGrowth = growth != null && Number.isFinite(Number(growth));
  const points = sparkline.length ? sparkline : [{ value: 0 }];
  return (
    <article className="admin-stat-card analytics-stat-card">
      <div className="analytics-stat-heading">
        <span className="admin-stat-label">{label}</span>
        {sparkline.length > 1 && <div className="analytics-stat-sparkline">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points}>
              <Area type="monotone" dataKey="value" stroke="var(--admin-accent)" fill="var(--admin-accent-soft)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>}
      </div>
      <strong className="admin-stat-value">{count}{suffix}</strong>
      {hasGrowth
        ? <span className={`analytics-growth${positive ? " positive" : " negative"}`}>{positive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}{Math.abs(Number(growth)).toFixed(1)}% vs previous</span>
        : <span className="analytics-growth muted">No comparison data</span>}
    </article>
  );
}
