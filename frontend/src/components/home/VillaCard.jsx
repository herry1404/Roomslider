import { Link } from "react-router-dom";
import { BedDouble, MapPin, Star, Users } from "lucide-react";

function VillaCard({ villa, distanceKm }) {
  const ratingValue = villa.averageRating ?? (
    typeof villa.rating === "object" ? villa.rating?.average : villa.rating
  );
  const rating = Number(ratingValue);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const reviewCount = villa.reviewCount ?? villa.rating?.count;
  const location = [villa.area, villa.city].filter(Boolean).join(", ");

  return (
    <Link className="villa-card" to={`/villas/${villa._id}`}>
      {villa.images?.[0] ? (
        <img src={villa.images[0]} alt={villa.name} loading="lazy" decoding="async" />
      ) : (
        <div className="villa-card-placeholder" role="img" aria-label="No villa photo available">Villa</div>
      )}
      <div className="villa-card-info">
        <div className="villa-card-heading">
          <h3>{villa.name}</h3>
          {hasRating && (
            <span className="villa-card-rating" aria-label={`${rating.toFixed(1)} out of 5`}>
              <Star size={14} fill="currentColor" aria-hidden="true" />
              {rating.toFixed(1)}
              {reviewCount != null && <small>({reviewCount})</small>}
            </span>
          )}
        </div>
        {location && <p><MapPin size={14} aria-hidden="true" />{location}</p>}
        {Number.isFinite(distanceKm) && (
          <p className="villa-card-distance">{distanceKm.toFixed(1)} km away</p>
        )}
        {(villa.maxGuests != null || villa.bedrooms != null) && (
          <div className="villa-card-meta">
            {villa.maxGuests != null && <span><Users size={14} aria-hidden="true" /> Up to {villa.maxGuests} guests</span>}
            {villa.bedrooms != null && <span><BedDouble size={14} aria-hidden="true" /> {villa.bedrooms} bedrooms</span>}
          </div>
        )}
        <div className="villa-card-rates">
          {villa.nightlyRate != null && Number.isFinite(Number(villa.nightlyRate)) && (
            <span className="villa-card-nightly">
              <strong>₹{Number(villa.nightlyRate).toLocaleString("en-IN")}</strong> / night
            </span>
          )}
          {villa.eventRate != null && Number.isFinite(Number(villa.eventRate)) && (
            <span className="villa-card-event">
              Event: ₹{Number(villa.eventRate).toLocaleString("en-IN")} / day
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default VillaCard;
