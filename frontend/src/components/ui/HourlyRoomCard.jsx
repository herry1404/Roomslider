import { Link } from "react-router-dom";
import { Clock3, MapPin, Star } from "lucide-react";
import "../../styles/room-card.css";

function getThumbnailUrl(url) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/w_500,h_500,c_fill,q_auto,f_auto/");
}

function HourlyRoomCard({ room }) {
  const firstImage = getThumbnailUrl(room.images?.[0]);
  const ratingValue = room.averageRating ?? (
    typeof room.rating === "object" ? room.rating?.average : room.rating
  );
  const rating = Number(ratingValue);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const reviewCount = room.reviewCount ?? room.rating?.count;
  const location = [room.location?.address, room.location?.city].filter(Boolean).join(", ");

  return (
    <Link
      to={`/hourly-rooms/${room.slug || room.title}`}
      className="room-card hourly-air-card"
      aria-label={`View ${room.title}`}
    >
      <span className="hourly-air-image-link" aria-hidden="true">
        {firstImage ? (
          <img
            src={firstImage}
            alt={room.title}
            className="hourly-air-image"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="hourly-air-image hourly-air-image-placeholder" role="img" aria-label="No room photo available" />
        )}
      </span>

      <div className="hourly-air-content">
        <div className="hourly-air-title-row">
          <h3>{room.title}</h3>
          {hasRating && (
            <span className="hourly-air-rating" aria-label={`${rating.toFixed(1)} out of 5`}>
              <Star size={14} fill="currentColor" aria-hidden="true" />
              {rating.toFixed(1)}
              {reviewCount != null && <small>({reviewCount})</small>}
            </span>
          )}
        </div>
        {location && (
          <p className="hourly-air-location">
            <MapPin size={14} aria-hidden="true" />
            <span>{location}</span>
          </p>
        )}
        {room.pricePerHour != null && Number.isFinite(Number(room.pricePerHour)) && (
          <p className="hourly-air-price">
            <strong>₹{Number(room.pricePerHour).toLocaleString("en-IN")}</strong>
            <span><Clock3 size={13} aria-hidden="true" /> / hour</span>
          </p>
        )}
      </div>
    </Link>
  );
}

export default HourlyRoomCard;
