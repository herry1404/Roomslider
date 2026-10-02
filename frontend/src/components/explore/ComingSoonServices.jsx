import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  Shirt,
  Banknote,
  ArrowRight,
  Sparkles,
  Truck,
  Sofa,
  Wifi,
  Wrench,
  Users,
  FileText,
  ShoppingBasket,
  BookOpen,
  Bike,
} from "lucide-react";
import LoanModal from "../services/LoanModal";

const comingSoon = [
  { icon: FileText, title: "Rent Agreement", desc: "Agreement and police verification" },
  { icon: ShoppingBasket, title: "Groceries", desc: "Order from nearby shops" },
  { icon: BookOpen, title: "Study Help", desc: "Printing, stationery and coaching" },
];

const cardStyle = {
  background: "var(--color-surface-2, #f3f4f6)",
  border: "1px solid var(--color-border, rgba(128,128,128,0.25))",
  borderRadius: "14px",
  padding: "14px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const titleStyle = { fontWeight: 600, fontSize: "14px", color: "var(--color-text)" };
const descStyle = { fontSize: "12.5px", color: "var(--color-text-light)" };

const pillStyle = {
  alignSelf: "flex-start",
  marginTop: "4px",
  fontSize: "11px",
  fontWeight: 600,
  padding: "3px 9px",
  borderRadius: "999px",
  background: "var(--color-primary, #16a34a)",
  color: "#fff",
  border: "none",
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

function ComingSoonServices() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [showLoanModal, setShowLoanModal] = useState(false);

  const liveServices = [
    {
      icon: Users,
      title: "Roommates",
      desc: "Meet people with similar budgets and plans",
      button: "Find",
      onClick: () => navigate(user ? "/roommates" : "/login"),
    },
    {
      icon: UtensilsCrossed,
      title: "Food",
      desc: "Find mess near you with today's menu & pricing",
      button: "Explore",
      onClick: () => navigate("/mess"),
    },
    {
      icon: Shirt,
      title: "Laundry",
      desc: "Find nearby laundries and order clothes on WhatsApp",
      button: "Explore",
      onClick: () => navigate("/laundry"),
    },
    {
      icon: Banknote,
      title: "Student Loans",
      desc: "Get help finding a loan for rent, deposit or fees",
      button: "Apply",
      onClick: () => (user ? setShowLoanModal(true) : navigate("/login")),
    },
    {
      icon: Bike,
      title: "Vehicle Rental",
      desc: "Bike and scooty rental by the day",
      button: "Explore",
      onClick: () => navigate("/vehicles"),
    },
    {
      icon: Sparkles,
      title: "Cleaning",
      desc: "Room and bathroom cleaning",
      button: "Explore",
      onClick: () => navigate("/services/cleaning"),
    },
    {
      icon: Truck,
      title: "Moving",
      desc: "Easy shifting to your new place",
      button: "Explore",
      onClick: () => navigate("/services/packers"),
    },
    {
      icon: Sofa,
      title: "Furniture Rental",
      desc: "Bed, cooler, AC, fridge on rent",
      button: "Explore",
      onClick: () => navigate("/furniture"),
    },
    {
      icon: Wifi,
      title: "Wi-Fi & RO",
      desc: "Broadband and RO purifier service",
      button: "Explore",
      onClick: () => navigate("/services/wifi"),
    },
    {
      icon: Wrench,
      title: "Repairs",
      desc: "Cooler, AC and geyser repair",
      button: "Explore",
      onClick: () => navigate("/services/appliance-repair"),
    },
  ];

  return (
    <>
      <style>{`
        .css-services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }
        @media (max-width: 576px) {
          .css-services-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
        }
      `}</style>

      <div className="css-services-grid">
        {liveServices.map(({ icon: Icon, title, desc, button, onClick }) => (
          <div
            key={title}
            onClick={onClick}
            style={{ ...cardStyle, cursor: "pointer" }}
          >
            <Icon size={22} color="var(--color-primary, #16a34a)" />
            <div style={titleStyle}>{title}</div>
            <div style={descStyle}>{desc}</div>
            <button type="button" style={{ ...pillStyle, cursor: "pointer" }}>
              {button}
              <ArrowRight size={12} />
            </button>
          </div>
        ))}

        {comingSoon.map(({ icon: Icon, title, desc }) => (
          <div key={title} style={cardStyle}>
            <Icon size={22} color="var(--color-primary, #16a34a)" />
            <div style={titleStyle}>{title}</div>
            <div style={descStyle}>{desc}</div>
            <span style={pillStyle}>Coming Soon</span>
          </div>
        ))}
      </div>

      {showLoanModal && <LoanModal onClose={() => setShowLoanModal(false)} />}
    </>
  );
}

export default ComingSoonServices;
