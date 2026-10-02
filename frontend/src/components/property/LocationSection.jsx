import { MapPin } from "lucide-react";
import RoomMap from "../map/RoomMap";

function LocationSection({ location, latitude, longitude, title, nearby = [] }) {
  if (!location && (latitude == null || longitude == null) && !nearby.length) return null;

  return (
    <section className="pd-section pd-location-section">
      <h2>Where you&apos;ll be</h2>
      {location && <p className="pd-location-address"><MapPin size={17} /> <span>{location}</span></p>}
      {nearby.length > 0 && (
        <div className="pd-nearby-chips">
          <h3>Nearby</h3>
          <ul>{nearby.map((place) => <li key={place}>{place}</li>)}</ul>
        </div>
      )}
      {latitude != null && longitude != null && (
        <div className="pd-map">
          <RoomMap lat={latitude} lng={longitude} title={title} />
        </div>
      )}
    </section>
  );
}

export default LocationSection;
