import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { roomPath } from "../../utils/roomUrl";
import { useState } from "react";
import {
  MapPin, Heart, BadgeCheck, Wifi, Snowflake, Bath, Tv, Refrigerator,
  Zap, Camera, Car, Shirt, Utensils, Droplets, BookOpen, Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ShareButton from "./ShareButton";

import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { requestLogin } from "../../utils/loginPrompt";

import "../../styles/room-card.css";

// Cloudinary on-the-fly thumbnail (small image for cards)
function getThumbnailUrl(url) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/w_600,h_600,c_fill,q_auto,f_auto/");
}

function amenityIcon(amenity) {
  const value = String(amenity).toLowerCase();
  if (value.includes("wi-fi") || value.includes("wifi")) return Wifi;
  if (value === "ac" || value.includes("air condition")) return Snowflake;
  if (value.includes("washroom") || value.includes("geyser")) return Bath;
  if (value.includes("tv")) return Tv;
  if (value.includes("fridge")) return Refrigerator;
  if (value.includes("power")) return Zap;
  if (value.includes("cctv")) return Camera;
  if (value.includes("parking")) return Car;
  if (value.includes("laundry")) return Shirt;
  if (value.includes("meal")) return Utensils;
  if (value.includes("water")) return Droplets;
  if (value.includes("study")) return BookOpen;
  return Sparkles;
}

function RoomCard({ room, onWishlistChange }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();

  const [loading, setLoading] = useState(false);
  const [burst, setBurst] = useState(false);

  const wishlisted = isWishlisted(room._id);

  // Grouped homepage cards -> property page; otherwise old room page
  const cardPath = room.property?._id
    ? `/property/${room.property.slug || room.property._id}${
        room.sharingType && room.sharingType !== "Other"
          ? `?sharing=${room.sharingType.toLowerCase()}`
          : ""
      }`
    : roomPath(room);

  const handleDetails = (e) => {
    if (e) e.stopPropagation();

    const detailsPath = cardPath;

    navigate(detailsPath);
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();

    if (!user) {
      requestLogin("Wishlist ke liye pehle login karo");
      return;
    }

    setLoading(true);

    try {
      if (wishlisted) {
        await removeFromWishlist(room._id);
        toast.success("Wishlist se hata diya");
      } else {
        await addToWishlist(room._id);
        toast.success("Wishlist mein add ho gaya ❤️");

        // trigger sparkle burst animation
        setBurst(true);
        setTimeout(() => setBurst(false), 700);
      }

      if (onWishlistChange) onWishlistChange();
    } catch (error) {
      toast.error(error.response?.data?.message || "Kuch galat ho gaya");
    } finally {
      setLoading(false);
    }
  };

  const firstImage = getThumbnailUrl(room.images?.[0]);
  const genderLabel = { Male: "Boys", Female: "Girls" }[room.gender];
  const sharingLabel = { Single: "Single Room", Double: "Double Sharing", Triple: "Triple Sharing" }[room.sharingType] || room.category;
  const typeLine = [sharingLabel, genderLabel].filter(Boolean).join(" · ");
  const hourlySlab = (room.hourlySlabs || [])
    .filter((slab) => Number(slab.hours) > 0 && Number(slab.price) > 0)
    .sort((first, second) => Number(first.hours) - Number(second.hours))[0];
  const amenities = Array.isArray(room.amenities)
    ? room.amenities
    : typeof room.amenities === "string" ? room.amenities.split(",").map((item) => item.trim()).filter(Boolean) : [];

  return (
    <div className="room-card rc-air" onClick={handleDetails} style={{ cursor: "pointer" }}>
      <div className="room-image-wrapper">
        <img
          src={optimizeCloudinaryImage(firstImage || "data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27600%27 height=%27600%27><rect width=%27100%25%27 height=%27100%25%27 fill=%27%23e5e7eb%27/></svg>", 640)}
          alt={room.title}
          className="room-image"
          loading="lazy"
          decoding="async"
        />

        <ShareButton room={room} variant="card" />
        {(room.isVerified || room.owner?.isVerified) && (
          <span className="room-card-verified"><BadgeCheck size={14} /> Verified</span>
        )}

        <button
          className={`wishlist-icon ${wishlisted ? "active" : ""} ${burst ? "burst" : ""}`}
          data-tour="wishlist"
          type="button"
          title="Add to wishlist"
          onClick={handleWishlist}
          disabled={loading}
        >
          <Heart size={20} fill={wishlisted ? "currentColor" : "none"} />

          {burst && (
            <span className="sparkle-wrap" aria-hidden="true">
              <span className="sparkle s1"></span>
              <span className="sparkle s2"></span>
              <span className="sparkle s3"></span>
              <span className="sparkle s4"></span>
              <span className="sparkle s5"></span>
              <span className="sparkle s6"></span>
            </span>
          )}
        </button>
      </div>

      <div className="room-content">
        <h3>
          <Link
            to={cardPath}
            onClick={(e) => e.stopPropagation()}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {room.property?.name || room.title}
          </Link>
        </h3>

        <div className="rc-price">
          {room.hourlyEnabled && hourlySlab
            ? <><strong>From ₹{Number(hourlySlab.price).toLocaleString("en-IN")}</strong><span>/ {hourlySlab.hours} hrs</span></>
            : <><strong>₹{room.price?.toLocaleString()}</strong><span>/month</span></>}
        </div>

        <p className="rc-type">{typeLine}</p>
        {amenities.length > 0 && (
          <div className="rc-amenities" aria-label="Top amenities">
            {amenities.slice(0, 3).map((amenity) => {
              const Icon = amenityIcon(amenity);
              return <span key={amenity} title={amenity} aria-label={amenity}><Icon size={14} /></span>;
            })}
          </div>
        )}

        <div className="room-location">
          <MapPin size={14} />
          <span>{room.location}</span>
        </div>
        {room.searchDistanceKm != null && (
          <p className="rc-distance">{room.searchDistanceKm.toFixed(1)} km from searched area</p>
        )}
      </div>
    </div>
  );
}

export default RoomCard;
