import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

function LatestRooms() {
  const navigate = useNavigate();

  const categoryPathMap = {
    Room: "rooms",
    PG: "pg",
    Hostel: "hostels",
    Flat: "flats",
  };

  const goToDetails = (room) => {
    const base = categoryPathMap[room.category] || "rooms";
    navigate(`/${base}/${room._id}`);
  };

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  const addToWishlist = async (roomId) => {
    try {
      if (!user) {
        toast.error("Please login first");
        return;
      }

      const res = await api.post(`/wishlist/${roomId}`);

      toast.success(res.data.message || "Added to wishlist ❤️");
    } catch (error) {
      console.error("Wishlist Error:", error);

      toast.error(error.response?.data?.message || "Wishlist failed");
    }
  };

  const fetchLatestRooms = async () => {
    try {
      const res = await api.get("/rooms");

      const roomData = res.data?.rooms || [];

      setRooms(roomData.slice(0, 5));
    } catch (error) {
      console.error("Latest Rooms Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestRooms();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <section className="latest-rooms">
      <div className="container">
        <div className="section-header">
          <h2>Latest Rooms</h2>

          <Link to="/rooms" className="view-all">
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="rooms-grid">
          {rooms.map((room) => (
            <article
              key={room._id}
              className="room-card"
              onClick={() => goToDetails(room)}
              style={{ cursor: "pointer" }}
            >
              <div className="room-image-wrap">
                <img
                  src={room.images?.[0]}
                  alt={room.title}
                  className="room-image"
                />

                <button
                  className="wishlist-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToWishlist(room._id);
                  }}
                >
                  <Heart size={16} />
                </button>

                <span className="price-badge">
                  ₹{room.price}
                  <small>/month</small>
                </span>
              </div>

              <div className="room-info">
                <h3>{room.title}</h3>

                <p className="room-location">
                  <MapPin size={14} />
                  {room.location}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LatestRooms;