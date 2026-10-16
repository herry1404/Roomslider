import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ANALYTICS_METRICS,
  formatAnalyticsDate,
  formatAxisValue,
  formatCount,
} from "./analyticsConfig";

export function MetricCard({ metric, value, comparison, periodLabel, suffix = "", displayValue }) {
  const definition = ANALYTICS_METRICS[metric];
  const count = Number(value) || 0;
  const change = Number(comparison);
  const hasComparison = count > 0 && Number.isFinite(change) && change !== 0;

  return (
    <article className="admin-stat-card analytics-stat-card" style={{ "--metric-color": definition.color }}>
      <span className="admin-stat-label">{definition.name}</span>
      <strong className="admin-stat-value">{displayValue ?? `${formatCount(count)}${suffix}`}</strong>
      <span className="analytics-metric-description">{definition.description}</span>
      <span className={`analytics-comparison${hasComparison ? (change > 0 ? " up" : " down") : ""}`}>
        {hasComparison ? (
          <>
            {change > 0 ? <ArrowUp size={16} aria-hidden="true" /> : <ArrowDown size={16} aria-hidden="true" />}
            {periodLabel} se {Math.abs(change).toLocaleString("en-IN", { maximumFractionDigits: 1 })}% {change > 0 ? "zyada" : "kam"}
          </>
        ) : "Abhi data nahi"}
      </span>
    </article>
  );
}

function ChartTooltip({ active, payload, label, lines }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="analytics-tooltip">
      <strong>{formatAnalyticsDate(label)}</strong>
      {payload.map((entry) => {
        const metric = lines.find((line) => line.key === entry.dataKey)?.metric;
        const definition = ANALYTICS_METRICS[metric];
        const verb = metric === "pageViews" ? "dekhe gaye"
          : metric === "visitors" || metric === "menuVisitors" ? "aaye"
            : metric === "searches" ? "hui"
              : metric === "signups" ? "bane"
                : metric === "menuViews" ? "khule"
                  : "record hue";
        return (
          <p key={entry.dataKey} style={{ "--metric-color": definition.color }}>
            <span>{formatAnalyticsDate(label)}: {formatCount(entry.value)} {definition.unit} {verb}</span>
          </p>
        );
      })}
    </div>
  );
}

export function TrendChart({ title, description, data, lines, emptyMessage, note }) {
  const [hiddenLines, setHiddenLines] = useState([]);
  const hasData = data?.some((row) => lines.some(({ key }) => Number(row[key]) > 0));

  return (
    <article className="admin-analytics-card analytics-chart-card">
      <header className="analytics-chart-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      {note && <p className="analytics-chart-note">{note}</p>}
      {hasData ? (
        <>
          <div className="analytics-chart-legend" aria-label={`${title} legend`}>
            {lines.map(({ key, metric }) => {
              const definition = ANALYTICS_METRICS[metric];
              const total = data.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
              const hidden = hiddenLines.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  className={`analytics-legend-item${hidden ? " hidden" : ""}`}
                  aria-pressed={!hidden}
                  onClick={() => setHiddenLines((current) => hidden ? current.filter((item) => item !== key) : [...current, key])}
                >
                  <span className="analytics-legend-dot" style={{ "--metric-color": definition.color }} />
                  <span>{definition.name} ({definition.unit}) {formatCount(total)}</span>
                </button>
              );
            })}
          </div>
          <div className="admin-analytics-chart analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, bottom: 2, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAnalyticsDate}
                  minTickGap={24}
                  stroke="var(--admin-muted)"
                  fontSize={14}
                />
                <YAxis
                  allowDecimals={false}
                  tickFormatter={formatAxisValue}
                  stroke="var(--admin-muted)"
                  fontSize={14}
                  width={44}
                />
                <Tooltip content={<ChartTooltip lines={lines} />} />
                {lines.map(({ key, metric }) => !hiddenLines.includes(key) && (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={ANALYTICS_METRICS[metric].name}
                    stroke={ANALYTICS_METRICS[metric].color}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="admin-empty analytics-empty">
          <h3>Abhi koi data nahi</h3>
          <p>{emptyMessage || "Jaise hi log site dekhenge, yahan dikhega."}</p>
        </div>
      )}
    </article>
  );
}

export function AnalyticsList({ title, description, rows, labelKey, valueKey, emptyMessage }) {
  return (
    <article className="admin-analytics-card analytics-list-card">
      <header className="analytics-chart-heading">
        <div><h2>{title}</h2><p>{description}</p></div>
      </header>
      {rows?.length ? (
        <div className="analytics-list">
          {rows.map((row, index) => (
            <div className="analytics-list-row" key={`${row[labelKey] || "item"}-${index}`}>
              <span>{row[labelKey] || "Unknown"}</span>
              <strong>{Number.isFinite(Number(row[valueKey])) ? formatCount(row[valueKey]) : row[valueKey]}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-empty analytics-empty">
          <h3>Abhi koi data nahi</h3>
          <p>{emptyMessage || "Jaise hi log site dekhenge, yahan dikhega."}</p>
        </div>
      )}
    </article>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="analytics-skeleton" role="status" aria-label="Analytics load ho raha hai">
      <span className="analytics-skeleton-bar" />
      <div className="admin-stats-grid">
        {[0, 1, 2, 3].map((item) => <span key={item} className="analytics-skeleton-card" />)}
      </div>
      <span className="analytics-skeleton-chart" />
    </div>
  );
}

export function AnalyticsEmptyState({ title = "Data jaldi aayega", message = "Abhi koi data nahi. Jaise hi log site dekhenge yahan dikhega." }) {
  return (
    <div className="admin-empty analytics-empty analytics-tab-empty">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}
