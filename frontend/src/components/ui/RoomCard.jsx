import { useState } from "react";
import { MapPin, IndianRupee, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

import "../../styles/room-card.css";

function RoomCard({ room, onWishlistChange }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  const categoryPathMap = {
    Room: "rooms",
    PG: "pg",
    Hostel: "hostels",
    Flat: "flats",
  };

  const handleDetails = () => {
    const base = categoryPathMap[room.category] || "rooms";
    navigate(`/${base}/${room._id}`);
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
        await api.delete(`/wishlist/${room._id}`);
        setWishlisted(false);
        toast.success("Wishlist se hata diya");
      } else {
        await api.post(`/wishlist/${room._id}`);
        setWishlisted(true);
        toast.success("Wishlist mein add ho gaya ❤️");
      }

      if (onWishlistChange) onWishlistChange();
    } catch (error) {
      toast.error(error.response?.data?.message || "Kuch galat ho gaya");
    } finally {
      setLoading(false);
    }
  };

  const firstImage = room.images?.[0];

  return (
    <div className="room-card" onClick={handleDetails} style={{ cursor: "pointer" }}>
      <div className="room-image-wrapper">
        <img
          src={firstImage || "https://via.placeholder.com/400x250"}
          alt={room.title}
          className="room-image"
        />

        <button
          className={wishlisted ? "wishlist-icon active" : "wishlist-icon"}
          type="button"
          title="Add to wishlist"
          onClick={handleWishlist}
          disabled={loading}
        >
          <Heart size={20} fill={wishlisted ? "currentColor" : "none"} />
        </button>

        <span className="room-category">{room.category}</span>
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