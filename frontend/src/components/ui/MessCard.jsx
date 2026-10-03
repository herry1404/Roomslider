import { Link } from "react-router-dom";
import { MapPin, IndianRupee, Star, UtensilsCrossed } from "lucide-react";

function MessCard({ mess }) {
  const rating = Number(mess.ratingAverage || 0).toFixed(1);
  const menuPreview =
    mess.todayMenu?.items?.map((i) => i.name).join(" • ") ||
    "Menu not updated yet";

  return (
    <Link to={`/mess/${mess.slug || mess._id}`} className="mess-card">
      <div className="mess-card-image">
        {mess.images && mess.images[0] ? (
          <img
            src={mess.images[0]}
            alt={mess.name}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <UtensilsCrossed size={40} color="var(--color-primary)" />
        )}
        <span className="mess-card-tag">{mess.mealType === "tiffin" ? "Tiffin" : "Thali"}</span>
      </div>

      <div className="mess-card-content">
        <div className="mess-card-heading">
          <h3>{mess.name}</h3>
          <span className="mess-card-rating" aria-label={mess.ratingCount ? `${rating} from ${mess.ratingCount} reviews` : "New mess, no reviews yet"}>
            <Star size={13} fill="currentColor" />
            {mess.ratingCount ? `${rating} (${mess.ratingCount})` : "New"}
          </span>
        </div>

        <div className="mess-card-location">
          <MapPin size={14} />
          <span>{mess.address}</span>
        </div>

        <p className="mess-card-menu">{menuPreview}</p>

        <div className="mess-card-price">
          <strong><IndianRupee size={15} />{mess.pricePerPerson?.toLocaleString()}</strong>
          <span>per {mess.mealType === "tiffin" ? "tiffin" : "thali"}</span>
        </div>
      </div>
    </Link>
  );
}

export default MessCard;
