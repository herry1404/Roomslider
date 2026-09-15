import { Shirt, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

function LaundryBanner() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const goToLaundry = () => {
    if (!user) {
      navigate("/login");
    } else {
      navigate("/my-place");
    }
  };

  return (
    <div
      onClick={goToLaundry}
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
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
        <Shirt size={30} color="var(--color-primary)" style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
            Need Laundry?
          </h3>
          <p style={{ fontSize: "13px", color: "var(--color-text-light)", margin: "2px 0 0" }}>
            Get your building's laundry vendor contact instantly.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          goToLaundry();
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
        Explore Laundry
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

export default LaundryBanner;
