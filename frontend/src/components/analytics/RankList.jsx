export default function RankList({ title, rows = [], labelKey = "title", valueKey = "views", emptyMessage = "No ranked data is available yet." }) {
  const maximum = Math.max(1, ...rows.map((row) => Number(row[valueKey]) || 0));
  return (
    <article className="admin-analytics-card analytics-rank-card">
      <header className="analytics-card-header"><h2>{title}</h2></header>
      {rows.length ? <ol className="analytics-rank-list">
        {rows.map((row, index) => {
          const value = Number(row[valueKey]) || 0;
          const percent = Math.round((value / maximum) * 100);
          return <li key={`${row.entityId || row[labelKey] || index}-${index}`}>
            <div className="analytics-rank-label"><span>{row[labelKey] || row.name || row.query || "Unknown"}</span><strong>{value.toLocaleString("en-IN")}</strong></div>
            <div className="analytics-rank-track"><span style={{ width: `${percent}%` }} /></div>
          </li>;
        })}
      </ol> : <div className="admin-empty"><h3>No data yet</h3><p>{emptyMessage}</p></div>}
    </article>
  );
}
