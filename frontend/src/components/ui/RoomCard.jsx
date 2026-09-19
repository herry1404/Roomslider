import { roomPath } from "../../utils/roomUrl";
import { useState } from "react";
import { MapPin, IndianRupee, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";

import "../../styles/room-card.css";

// FIX (slow images bug): Cloudinary URLs support "on-the-fly" resizing
// via the URL itself — no re-upload needed. Original images are stored
// at 1600x1067, but a card thumbnail only needs ~500px wide. This
// inserts a transformation segment (w_500,h_320,c_fill,q_auto,f_auto)
// right after "/upload/" in the Cloudinary URL, so the browser
// downloads a much smaller file for the card view.
function getThumbnailUrl(url) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/w_500,h_320,c_fill,q_auto,f_auto/");
}

function RoomCard({ room, onWishlistChange }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();

  const [loading, setLoading] = useState(false);
  const [burst, setBurst] = useState(false);

  const wishlisted = isWishlisted(room._id);

  const categoryPathMap = {
    Room: "rooms",
    PG: "pg",
    Hostel: "hostels",
    Flat: "flats",
  };

  const handleDetails = () => {
    navigate(roomPath(room));
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Wishlist ke liye pehle login karo");
      navigate("/login");
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

  return (
    <div className="room-card" onClick={handleDetails} style={{ cursor: "pointer" }}>
      <div className="room-image-wrapper">
        <img
          src={firstImage || "https://via.placeholder.com/500x320"}
          alt={room.title}
          className="room-image"
          loading="lazy"
          decoding="async"
        />

        <button
          className={`wishlist-icon ${wishlisted ? "active" : ""} ${burst ? "burst" : ""}`}
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

        <span className="room-category">{room.category}</span>
        {room.gender && room.gender !== "Any" && (
          <span
            className="room-category"
            style={{ left: "auto", right: "12px", background: room.gender === "Male" ? "#3b82f6" : "#ec4899" }}
          >
            {room.gender}
          </span>
        )}
      </div>

      <div className="room-content">
        <h3>{room.title}</h3>

        <div className="room-location">
          <MapPin size={16} />
          <span>{room.location}</span>
        </div>

        <div className="room-price">
          <IndianRupee size={17} />
          <strong>{room.price?.toLocaleString()}</strong>
          <span>/month</span>
        </div>

        <p>
          {room.description?.length > 80
            ? room.description.substring(0, 80) + "..."
            : room.description}
        </p>

        <button className="view-btn" onClick={handleDetails} type="button">
          View Details
        </button>
      </div>
    </div>
  );
}

export default RoomCard;