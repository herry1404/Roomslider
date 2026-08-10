import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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
  const center =
    latitude && longitude ? [latitude, longitude] : [22.7196, 75.8577]; // Indore default

  return (
    <div className="form-section">
      <h2>Building Location on Map</h2>
      <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "10px" }}>
        Map par jahan building hai wahan click karo — pin lag jayega. Chahe toh pin ko drag bhi kar sakte ho.
      </p>
      <div style={{ height: "300px", borderRadius: "16px", overflow: "hidden" }}>
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
        <p style={{ fontSize: "12px", color: "#16a34a", marginTop: "6px" }}>
          📍 Pin lag gaya: {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
      )}
    </div>
  );
}

export default LocationPicker;
