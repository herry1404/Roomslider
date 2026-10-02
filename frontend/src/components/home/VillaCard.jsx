import { Link } from "react-router-dom";
import { MapPin, Users, BedDouble } from "lucide-react";

function VillaCard({ villa }) {
  return (
    <Link className="villa-card" to={`/villas/${villa._id}`}>
      {villa.images?.[0] ? (
        <img src={villa.images[0]} alt={villa.name} loading="lazy" />
      ) : (
        <div className="villa-card-placeholder">Villa</div>
      )}
      <div className="villa-card-info">
        <h3>{villa.name}</h3>
        <p><MapPin size={14} />{villa.area}, {villa.city}</p>
        <div className="villa-card-meta">
          <span><Users size={14} /> Up to {villa.maxGuests}</span>
          <span><BedDouble size={14} /> {villa.bedrooms} bedrooms</span>
        </div>
        <div className="villa-card-rates">
          <span>Stay <strong>₹{Number(villa.nightlyRate).toLocaleString("en-IN")}/night</strong></span>
          <span>Event <strong>₹{Number(villa.eventRate).toLocaleString("en-IN")}/day</strong></span>
        </div>
      </div>
    </Link>
  );
}

export default VillaCard;
