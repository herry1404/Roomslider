import { Link } from "react-router-dom";
import { MapPin, IndianRupee, UtensilsCrossed } from "lucide-react";
import "../../styles/room-card.css";

function MessCard({ mess }) {
  const menuPreview =
    mess.todayMenu?.items?.map((i) => i.name).join(" • ") ||
    "Menu not updated yet";

  return (
    <Link to={`/mess/${mess._id}`} className="room-card" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="room-image-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-surface-2)" }}>
        {mess.images && mess.images[0] ? (
          <img
            src={mess.images[0]}
            alt={mess.name}
            className="room-image"
            loading="lazy"
          />
        ) : (
          <UtensilsCrossed size={40} color="var(--color-primary)" />
        )}
        <span className="room-category">Mess</span>
      </div>

      <div className="room-content">
        <h3>{mess.name}</h3>

        <div className="room-location">
          <MapPin size={16} />
          <span>{mess.address}</span>
        </div>

        <div className="room-price">
          <IndianRupee size={17} />
          <strong>{mess.pricePerPerson?.toLocaleString()}</strong>
          <span>/thali</span>
        </div>

        <p style={{ fontSize: 13, color: "var(--color-text-light)" }}>
          Today: {menuPreview}
        </p>
      </div>
    </Link>
  );
}

export default MessCard;
