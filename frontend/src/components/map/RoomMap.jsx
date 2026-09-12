import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MapPin, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function RoomMap({ lat, lng, title }) {
  const [showMap, setShowMap] = useState(false);

  if (!lat || !lng) return null;

  return (
    <>
      <style>{`
        @keyframes mapPinPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes mapBannerFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .map-pin-icon {
          animation: mapPinPulse 1.4s ease-in-out infinite;
        }
        .map-view-banner {
          animation: mapBannerFade 0.3s ease-out;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .map-view-banner:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        .map-expand-wrap {
          overflow: hidden;
          max-height: ${showMap ? "400px" : "0px"};
          opacity: ${showMap ? 1 : 0};
          transition: max-height 0.4s ease, opacity 0.3s ease;
        }
        .map-close-btn {
          transition: background 0.2s ease, transform 0.15s ease;
        }
        .map-close-btn:hover {
          background: #f1f5f9;
          transform: scale(1.05);
        }
      `}</style>

      {!showMap && (
        <button
          onClick={() => setShowMap(true)}
          className="map-view-banner"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            color: "#16a34a",
          }}
        >
          <MapPin size={18} color="#ef4444" className="map-pin-icon" />
          Click here for map view
        </button>
      )}

      <div className="map-expand-wrap">
        <div style={{ position: "relative", height: "300px", borderRadius: "16px", overflow: "hidden" }}>
          <button
            onClick={() => setShowMap(false)}
            className="map-close-btn"
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            }}
          >
            <X size={16} color="#334155" />
          </button>
          {showMap && (
            <MapContainer center={[lat, lng]} zoom={15} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[lat, lng]} icon={icon}>
                <Popup>{title}</Popup>
              </Marker>
            </MapContainer>
          )}
        </div>
      </div>
    </>
  );
}

export default RoomMap;
