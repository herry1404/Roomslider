import { UtensilsCrossed, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

function MessBanner() {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate("/mess")}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        padding: "18px 20px",
        borderRadius: "18px",
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        cursor: "pointer",
        flexWrap: "wrap",
        marginTop: "14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
        <UtensilsCrossed size={30} color="var(--color-primary)" style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
            Hungry? Order a Thali
          </h3>
          <p style={{ fontSize: "13px", color: "var(--color-text-light)", margin: "2px 0 0" }}>
            Find mess near you with today's menu &amp; pricing.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          navigate("/mess");
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "10px 18px",
          borderRadius: "999px",
          background: "var(--color-primary)",
          color: "#fff",
          fontSize: "13.5px",
          fontWeight: 700,
          whiteSpace: "nowrap",
          flexShrink: 0,
          border: "none",
        }}
      >
        Explore Mess
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

export default MessBanner;
