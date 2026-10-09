import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, Share2, Star } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import shareVilla from "../../utils/shareVilla";
import "../../styles/room-card.css";

function VillaCard({ villa, distanceKm, onWishlistChange }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
  const [sharing, setSharing] = useState(false);
  const ratingValue = villa.averageRating ?? (
    typeof villa.rating === "object" ? villa.rating?.average : villa.rating
  );
  const rating = Number(ratingValue);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const reviewCount = villa.reviewCount ?? villa.rating?.count;
  const location = [villa.area, villa.city].filter(Boolean).join(", ");
  const detailPath = `/villas/${villa.slug || villa._id}`;
  const wishlisted = isWishlisted(villa._id);

  const toggleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      toast.error("Login to save this villa");
      navigate("/login");
      return;
    }
    try {
      const updated = wishlisted
        ? await removeFromWishlist(villa._id)
        : await addToWishlist(villa._id);
      if (!updated) return;
      if (wishlisted) onWishlistChange?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update wishlist");
    }
  };

  const share = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (sharing) return;
    setSharing(true);
    try {
      await shareVilla(villa);
    } finally {
      setSharing(false);
    }
  };

  return (
    <article className="room-card rc-air villa-card">
      <div className="room-image-wrapper villa-image-wrapper">
        <Link className="villa-card-main-link" to={detailPath} aria-label={`View ${villa.name}`}>
          {villa.images?.[0] ? (
            <img className="room-image" src={optimizeCloudinaryImage(villa.images[0], 640)} alt={villa.name} loading="lazy" decoding="async" />
          ) : (
            <span className="villa-card-placeholder" role="img" aria-label="No villa photo available">Villa</span>
          )}
        </Link>
        <div className="villa-card-actions">
          <button className={`wishlist-icon${wishlisted ? " active" : ""}`} type="button" onClick={toggleWishlist} aria-label={wishlisted ? "Remove villa from wishlist" : "Add villa to wishlist"}>
            <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
          </button>
          <button className="share-btn share-btn--card villa-share-btn" type="button" onClick={share} aria-label="Share villa" disabled={sharing}>
            <Share2 size={17} />
          </button>
        </div>
      </div>
      <div className="room-content villa-card-info">
        <div className="villa-card-heading">
          <h3><Link to={detailPath}>{villa.name}</Link></h3>
          {hasRating && (
            <span className="villa-card-rating" aria-label={`${rating.toFixed(1)} out of 5`}>
              <Star size={14} fill="currentColor" aria-hidden="true" />
              {rating.toFixed(1)}
              {reviewCount != null && <small>({reviewCount})</small>}
            </span>
          )}
        </div>
        {(villa.maxGuests != null || villa.bedrooms != null) && (
          <p className="rc-type">
            {[
              villa.maxGuests != null && `Up to ${villa.maxGuests} guests`,
              villa.bedrooms != null && `${villa.bedrooms} bedrooms`,
            ].filter(Boolean).join(" · ")}
          </p>
        )}
        {villa.nightlyRate != null && Number.isFinite(Number(villa.nightlyRate)) && (
          <div className="rc-price"><strong>₹{Number(villa.nightlyRate).toLocaleString("en-IN")}</strong><span>/night</span></div>
        )}
        {villa.eventRate != null && Number.isFinite(Number(villa.eventRate)) && (
          <p className="rc-type">Event: ₹{Number(villa.eventRate).toLocaleString("en-IN")} / day</p>
        )}
        {location && <div className="room-location"><MapPin size={14} aria-hidden="true" /><span>{location}</span></div>}
        {Number.isFinite(distanceKm) && <p className="rc-distance">{distanceKm.toFixed(1)} km away</p>}
      </div>
    </article>
  );
}

export default VillaCard;
