import { Zap, BedDouble, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

function HourlyBanner() {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate("/hourly-rooms")}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        padding: "18px 20px",
        borderRadius: "18px",
        background: "linear-gradient(135deg, #e8ecfb, #eef1fb)",
        border: "1px solid #dde3fa",
        cursor: "pointer",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <BedDouble size={30} color="#3b4ba0" />
          <Zap
            size={16}
            fill="#3b4ba0"
            color="#3b4ba0"
            style={{ position: "absolute", top: -4, right: -8 }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", margin: 0 }}>
            Need a Room Immediately?
          </h3>
          <p style={{ fontSize: "13px", color: "var(--color-text-light)", margin: "2px 0 0" }}>
            Check our Hourly Stays for short visits &amp; day use.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          navigate("/hourly-rooms");
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "10px 18px",
          borderRadius: "999px",
          background: "#111827",
          color: "#fff",
          fontSize: "13.5px",
          fontWeight: 700,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Explore Now
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

export default HourlyBanner;
