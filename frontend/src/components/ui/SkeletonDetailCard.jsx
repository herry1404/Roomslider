import "../../styles/skeleton.css";

function SkeletonDetailCard() {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "20px",
        padding: "24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
        <div className="skeleton shimmer" style={{ width: 56, height: 56, borderRadius: "14px", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton shimmer" style={{ height: "20px", width: "60%", marginBottom: "8px", borderRadius: "6px" }} />
          <div className="skeleton shimmer" style={{ height: "14px", width: "40%", borderRadius: "6px" }} />
        </div>
      </div>

      <div className="skeleton shimmer" style={{ height: "50px", width: "100%", borderRadius: "14px", marginBottom: "20px" }} />

      <div className="skeleton shimmer" style={{ height: "18px", width: "35%", marginBottom: "12px", borderRadius: "6px" }} />
      <div className="skeleton shimmer" style={{ height: "14px", width: "90%", marginBottom: "8px", borderRadius: "6px" }} />
      <div className="skeleton shimmer" style={{ height: "14px", width: "75%", marginBottom: "20px", borderRadius: "6px" }} />

      <div style={{ display: "flex", gap: "10px" }}>
        <div className="skeleton shimmer" style={{ flex: 1, height: "48px", borderRadius: "14px" }} />
        <div className="skeleton shimmer" style={{ flex: 2, height: "48px", borderRadius: "14px" }} />
      </div>
    </div>
  );
}

export default SkeletonDetailCard;
