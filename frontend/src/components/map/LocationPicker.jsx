import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import { Locate } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function LocationPicker({ latitude, longitude, onChange }) {
  const [locating, setLocating] = useState(false);
  const center =
    latitude && longitude ? [latitude, longitude] : [22.7196, 75.8577]; // Indore default

  const useMyLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  return (
    <div className="form-section">
      <h2>Building Location on Map</h2>
      <p style={{ fontSize: "13px", color: "var(--color-text-light)", marginBottom: "10px" }}>
        Map par jahan building hai wahan click karo — pin lag jayega. Chahe toh pin ko drag bhi kar sakte ho.
      </p>
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          marginBottom: "12px",
          borderRadius: "10px",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface-2)",
          color: "var(--color-text)",
          fontSize: "14px",
          fontWeight: 600,
          cursor: locating ? "default" : "pointer",
          opacity: locating ? 0.7 : 1,
        }}
      >
        <Locate size={16} />
        {locating ? "Locating..." : "Use My Current Location"}
      </button>
      <div className="location-map-wrapper leaflet-map-wrapper" style={{ height: "300px", borderRadius: "16px", overflow: "hidden" }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          {latitude && longitude && (
            <Marker
              position={[latitude, longitude]}
              icon={icon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  onChange(lat, lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      {latitude && longitude && (
        <p style={{ fontSize: "12px", color: "var(--color-primary)", marginTop: "6px" }}>
          📍 Pin lag gaya: {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
      )}
    </div>
  );
}

export default LocationPicker;
