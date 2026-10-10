import { useState } from "react";
import { Heart, MapPin, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { roomPath } from "../../utils/roomUrl";
import { cloudinarySrcSet, cloudinaryUrl } from "../../utils/optimizeCloudinaryImage";
import { requestLogin } from "../../utils/loginPrompt";
import "../../styles/hourly-listings.css";

function HourlyRoomCard({ room }) {
  const { user } = useAuth();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
  const [sharing, setSharing] = useState(false);
  const isHourlyRoomCollection = room.pricePerHour != null || room.location?.address;
  const wishlisted = isWishlisted(room._id);
  const firstImage = room.images?.[0];
  const location = isHourlyRoomCollection
    ? [room.location?.address, room.location?.city].filter(Boolean).join(", ")
    : room.location;
  const slab = (room.hourlySlabs || [])
    .filter((item) => Number(item.hours) > 0 && Number(item.price) > 0)
    .sort((first, second) => Number(first.hours) - Number(second.hours))[0];
  const detailPath = isHourlyRoomCollection
    ? `/hourly-rooms/${room.slug || room._id}`
    : room.property?._id
      ? `/property/${room.property.slug || room.property._id}${room.sharingType && room.sharingType !== "Other"
      ? `?sharing=${encodeURIComponent(room.sharingType.toLowerCase())}`
      : ""}`
      : roomPath(room);

  const toggleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      requestLogin("Please login to add to wishlist");
      return;
    }
    if (wishlisted) {
      await removeFromWishlist(room._id);
    } else {
      await addToWishlist(room._id);
    }
  };

  const shareListing = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const url = `${window.location.origin}${detailPath}`;
    if (sharing) return;
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({ title: room.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch (error) {
      if (error?.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      } catch {
        toast.error("Could not share listing link");
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <article className="hourly-listing-card">
      <div className="hourly-listing-photo">
        <Link to={detailPath} aria-label={`View ${room.title}`}>
          {firstImage
            ? <img
                src={cloudinaryUrl(firstImage, 280)}
                srcSet={cloudinarySrcSet(firstImage)}
                sizes="(max-width:600px) 50vw, 280px"
                alt={`${room.title} short stay in ${location || "Indore"}`}
                width="280"
                height="280"
                loading="lazy"
                decoding="async"
              />
            : <span className="hourly-listing-photo-empty" />}
        </Link>
        <div className="hourly-listing-actions">
          <button
            type="button"
            onClick={toggleWishlist}
            aria-label={`${wishlisted ? "Remove" : "Add"} ${room.title} ${wishlisted ? "from" : "to"} wishlist`}
            aria-pressed={wishlisted}
          >
            <Heart size={19} fill={wishlisted ? "currentColor" : "none"} />
          </button>
          <button type="button" onClick={shareListing} aria-label="Share listing" disabled={sharing}>
            <Share2 size={18} />
          </button>
        </div>
      </div>
      <div className="hourly-listing-info">
        <Link className="hourly-listing-name" to={detailPath}>{room.property?.name || room.title}</Link>
        {isHourlyRoomCollection ? (
          <p className="hourly-listing-price">₹{Number(room.pricePerHour).toLocaleString("en-IN")} / hour</p>
        ) : slab && (
          <p className="hourly-listing-price">
            From ₹{Number(slab.price).toLocaleString("en-IN")} / {slab.hours} hrs
          </p>
        )}
        <p className="hourly-listing-location"><MapPin size={13} />{location}</p>
        <span className="hourly-listing-badge">Hourly</span>
      </div>
    </article>
  );
}

export default HourlyRoomCard;
