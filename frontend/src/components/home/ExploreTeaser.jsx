import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  Banknote,
  BedDouble,
  Bike,
  BookOpen,
  Castle,
  FileText,
  HeartHandshake,
  HeartPulse,
  LayoutGrid,
  PackageOpen,
  Shirt,
  Sofa,
  Sparkles,
  Truck,
  Users,
  UtensilsCrossed,
  Wifi,
  Wrench,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import LoanModal from "../services/LoanModal";
import { DEFAULT_HOME_TILES } from "../../utils/homeExploreTiles";

const ICONS = {
  Banknote,
  BedDouble,
  Bike,
  BookOpen,
  Castle,
  FileText,
  HeartHandshake,
  HeartPulse,
  LayoutGrid,
  PackageOpen,
  Shirt,
  Sofa,
  Sparkles,
  Truck,
  Users,
  UtensilsCrossed,
  Wifi,
  Wrench,
};

function ExploreTeaser({ section }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showLoanModal, setShowLoanModal] = useState(false);
  const tiles = Array.isArray(section?.config?.tiles) && section.config.tiles.length
    ? section.config.tiles
    : DEFAULT_HOME_TILES;

  return (
    <section className="latest-rooms home-explore-section">
      <div className="container">
        <div className="section-header">
          <h2>{section?.title && section.title !== "Explore" ? section.title : "Everything you need away from home"}</h2>
        </div>

        <div className="home-explore-tiles">
          {tiles.map((tile, index) => {
            const Icon = ICONS[tile.icon] || LayoutGrid;
            const openLoan = () => {
              if (user) setShowLoanModal(true);
              else navigate("/login");
            };
            const content = (
              <>
                <Icon size={22} color="var(--color-primary)" />
                <span className="home-explore-tile-title">{tile.title}</span>
                <span className="home-explore-tile-description">{tile.desc}</span>
                <span className="home-explore-tile-action">
                  {tile.pill || "Explore"} <ArrowRight size={12} />
                </span>
              </>
            );

            return tile.action === "loan" ? (
              <button
                type="button"
                key={`${tile.title}-${index}`}
                className="home-explore-tile"
                onClick={openLoan}
              >
                {content}
              </button>
            ) : (
              <Link
                key={`${tile.title}-${index}`}
                className="home-explore-tile"
                to={tile.to || "/explore"}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
      {showLoanModal && <LoanModal onClose={() => setShowLoanModal(false)} />}
    </section>
  );
}

export default ExploreTeaser;
