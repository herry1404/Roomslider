import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BedDouble, Banknote, Bike, LayoutGrid, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import LoanModal from "../services/LoanModal";

const tileStyle = {
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: "14px",
  padding: "14px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  cursor: "pointer",
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
  background: "var(--color-primary)",
  color: "#fff",
  border: "none",
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const comingSoonPillStyle = {
  ...pillStyle,
  background: "var(--color-surface)",
  color: "var(--color-text-light)",
  border: "1px solid var(--color-border)",
};

function ExploreTeaser() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showLoanModal, setShowLoanModal] = useState(false);

  const tiles = [
    {
      icon: BedDouble,
      title: "Hourly Rooms",
      desc: "Short stays, day use, hourly rate",
      pill: "Explore Now",
      onClick: () => navigate("/hourly-rooms"),
    },
    {
      icon: Banknote,
      title: "Student Loan",
      desc: "Help finding a loan for rent or fees",
      pill: "Apply Now",
      onClick: () => (user ? setShowLoanModal(true) : navigate("/login")),
    },
    {
      icon: Bike,
      title: "Rent a Vehicle",
      desc: "Bike and scooty rental by the day",
      pill: "Coming Soon",
      comingSoon: true,
      onClick: () => navigate("/explore"),
    },
    {
      icon: LayoutGrid,
      title: "More Services",
      desc: "Mess, laundry and more",
      pill: "View All",
      onClick: () => navigate("/explore"),
    },
  ];

  return (
    <section className="latest-rooms">
      <div className="container">
        <div className="section-header">
          <h2>Explore</h2>
          <Link to="/explore" className="view-all">
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "12px",
          }}
        >
          {tiles.map(({ icon: Icon, title, desc, pill, onClick, comingSoon }) => (
            <div key={title} onClick={onClick} style={tileStyle}>
              <Icon size={22} color="var(--color-primary)" />
              <div style={titleStyle}>{title}</div>
              <div style={descStyle}>{desc}</div>
              <span style={comingSoon ? comingSoonPillStyle : pillStyle}>
                {pill}
                {!comingSoon && <ArrowRight size={12} />}
              </span>
            </div>
          ))}
        </div>
      </div>

      {showLoanModal && <LoanModal onClose={() => setShowLoanModal(false)} />}
    </section>
  );
}

export default ExploreTeaser;
