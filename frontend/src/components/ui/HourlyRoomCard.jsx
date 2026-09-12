import { MapPin, IndianRupee, Clock } from "lucide-react";
import "../../styles/room-card.css";

// FIX (slow images bug): request a Cloudinary-resized thumbnail instead
// of the full 1600px original — see RoomCard.jsx for the same fix.
function getThumbnailUrl(url) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/w_500,h_320,c_fill,q_auto,f_auto/");
}

function HourlyRoomCard({ room }) {
  const firstImage = getThumbnailUrl(room.images?.[0]);

  return (
    <div className="room-card">
      <div className="room-image-wrapper">
        <img
          src={firstImage || "https://via.placeholder.com/500x320"}
          alt={room.title}
          className="room-image"
          loading="lazy"
          decoding="async"
        />
        <span className="room-category">Hourly</span>
      </div>

      <div className="room-content">
        <h3>{room.title}</h3>

        <div className="room-location">
          <MapPin size={16} />
          <span>{room.location?.address}, {room.location?.city}</span>
        </div>

        <div className="room-price">
          <IndianRupee size={17} />
          <strong>{room.pricePerHour?.toLocaleString()}</strong>
          <span>
            <Clock size={14} style={{ marginLeft: 4, marginRight: 2, verticalAlign: "middle" }} />
            /hour
          </span>
        </div>

        {room.description && (
          <p>
            {room.description.length > 80
              ? room.description.substring(0, 80) + "..."
              : room.description}
          </p>
        )}

        {room.amenities && room.amenities.length > 0 && (
          <p style={{ fontSize: 13, color: "#666" }}>
            {room.amenities.join(" • ")}
          </p>
        )}
      </div>
    </div>
  );
}

export default HourlyRoomCard;