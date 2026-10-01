import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BedDouble,
  Banknote,
  Bike,
  LayoutGrid,
  ArrowRight,
  UtensilsCrossed,
  Shirt,
  Sparkles,
  Truck,
  Sofa,
  Wifi,
  Wrench,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import LoanModal from "../services/LoanModal";

const tileStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "20px",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  cursor: "pointer",
};

const titleStyle = { fontWeight: 600, fontSize: "16px", color: "var(--color-text)" };
const descStyle = { fontSize: "12.5px", color: "var(--color-text-light)" };

const pillStyle = {
  alignSelf: "flex-start",
  marginTop: "4px",
  fontSize: "13px",
  fontWeight: 600,
  padding: "0",
  borderRadius: "999px",
  background: "none",
  color: "var(--color-primary)",
  border: "none",
  display: "flex",
  alignItems: "center",
  gap: "4px",
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
      to: "/hourly-rooms",
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
      pill: "Explore Now",
      to: "/vehicles",
    },
    {
      icon: UtensilsCrossed,
      title: "Hungry? Order a Thali",
      desc: "Mess near you with today's menu",
      pill: "Explore Mess",
      extra: true,
      to: "/mess",
    },
    {
      icon: Shirt,
      title: "Need Laundry?",
      desc: "Get your building's laundry vendor",
      pill: "Explore Laundry",
      extra: true,
      onClick: () => navigate(user ? "/my-place" : "/login"),
    },
    {
      icon: Sparkles,
      title: "Cleaning & Housekeeping",
      desc: "Room and bathroom cleaning",
      pill: "Find Cleaners",
      extra: true,
      to: "/services/cleaning",
    },
    {
      icon: Truck,
      title: "Packers & Movers",
      desc: "Easy shifting to your new place",
      pill: "Find Movers",
      extra: true,
      to: "/services/packers",
    },
    {
      icon: Sofa,
      title: "Furniture & Appliance Rental",
      desc: "Bed, cooler, AC, fridge on rent",
      pill: "Explore Rentals",
      extra: true,
      to: "/furniture",
    },
    {
      icon: Wifi,
      title: "WiFi & RO Water",
      desc: "Broadband and RO purifier service",
      pill: "Find Providers",
      extra: true,
      to: "/services/wifi",
    },
    {
      icon: Wrench,
      title: "Appliance Repair",
      desc: "Cooler, AC and geyser repair",
      pill: "Find Repair",
      extra: true,
      to: "/services/appliance-repair",
    },
    {
      icon: LayoutGrid,
      title: "More",
      desc: "See everything RoomSlider offers",
      pill: "View All",
      to: "/explore",
    },
  ];

  return (
    <section className="latest-rooms">
      <div className="container">
        <div className="section-header">
          <h2>Everything you need away from home</h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "12px",
          }}
        >
          {tiles.map(({ icon: Icon, title, desc, pill, onClick, to, extra }) => {
            const Tag = to ? Link : "div";
            const tagProps = to ? { to } : { onClick };
            return (
            <Tag
              key={title}
              {...tagProps}
              style={{ ...tileStyle, textDecoration: "none", color: "inherit" }}
              className={extra ? "explore-extra-tile" : ""}
            >
              <Icon size={22} color="var(--color-primary)" />
              <div style={titleStyle}>{title}</div>
              <div style={descStyle}>{desc}</div>
              <span style={pillStyle}>
                {pill}
                <ArrowRight size={12} />
              </span>
            </Tag>
            );
          })}
        </div>
      </div>

      {showLoanModal && <LoanModal onClose={() => setShowLoanModal(false)} />}
    </section>
  );
}

export default ExploreTeaser;
