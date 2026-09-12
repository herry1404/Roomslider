import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, MapPin } from "lucide-react";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function RoomMap({ lat, lng, title }) {
  const [open, setOpen] = useState(false);

  if (!lat || !lng) return null;

  return (
    <>
      <div className="room-map-strip" onClick={() => setOpen(true)}>
        <div className="room-map-strip-bg">
          <MapContainer
            center={[lat, lng]}
            zoom={15}
            zoomControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
            attributionControl={false}
            style={{ height: "100%", width: "100%", pointerEvents: "none" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </MapContainer>
        </div>
        <div className="room-map-strip-overlay">
          <MapPin size={18} />
          <span>Click for map view</span>
        </div>
      </div>

      {open && (
        <div
          className="room-map-modal-backdrop"
          onClick={() => setOpen(false)}
        >
          <div
            className="room-map-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="room-map-modal-close"
              onClick={() => setOpen(false)}
              aria-label="Close map"
            >
              <X size={20} />
            </button>
            <MapContainer
              center={[lat, lng]}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[lat, lng]} icon={icon}>
                <Popup>{title}</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}
    </>
  );
}

export default RoomMap;
