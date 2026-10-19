import { useState } from "react";

const categories = ["room", "pg", "hostel", "flat", "mess", "villa", "vehicle", "furniture", "cafe"];
const dateValue = (date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(date);

export default function FilterBar({ filters, onChange, hideCategoryArea = false }) {
  const [from, setFrom] = useState(filters.from || "");
  const [to, setTo] = useState(filters.to || "");
  const [rangeError, setRangeError] = useState("");
  const applyCustom = () => {
    if (!from || !to || from > to) {
      setRangeError("Choose a valid start and end date.");
      return;
    }
    const days = Math.floor((new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000) + 1;
    if (days > 366) {
      setRangeError("Date ranges can include up to 366 days.");
      return;
    }
    setRangeError("");
    onChange({ range: "", from, to });
  };

  return (
    <section className="analytics-filter-bar" aria-label="Analytics filters">
      <div className="analytics-filter-scroll">
        <div className="analytics-range-options" aria-label="Date range">
          {[
            ["live", "Live"],
            ["today", "Today"],
            ["7d", "7d"],
            ["30d", "30d"],
            ["90d", "90d"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={filters.range === value ? "selected" : ""}
              aria-pressed={filters.range === value}
              onClick={() => onChange({ range: value, from: "", to: "" })}
            >
              {value === "live" && <span className="analytics-live-dot" />}
              {label}
            </button>
          ))}
          <button
            type="button"
            className={filters.from && filters.to ? "selected" : ""}
            onClick={() => setRangeError("")}
          >
            Custom
          </button>
        </div>
        <label className="analytics-filter-field">
          From
          <input type="date" max={dateValue(new Date())} value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="analytics-filter-field">
          To
          <input type="date" max={dateValue(new Date())} value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <button type="button" className="admin-btn analytics-apply-button" onClick={applyCustom}>Apply</button>
        {!hideCategoryArea && <>
          <label className="analytics-filter-field">
            Category
            <select value={filters.category} onChange={(event) => onChange({ category: event.target.value })}>
              <option value="">All</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="analytics-filter-field analytics-area-field">
            Area
            <input type="search" value={filters.area} placeholder="All areas" onChange={(event) => onChange({ area: event.target.value })} />
          </label>
        </>}
        <label className="analytics-compare-toggle">
          <input type="checkbox" checked={filters.compare} onChange={(event) => onChange({ compare: event.target.checked })} />
          Compare previous period
        </label>
      </div>
      {rangeError && <p className="analytics-filter-error" role="alert">{rangeError}</p>}
    </section>
  );
}
