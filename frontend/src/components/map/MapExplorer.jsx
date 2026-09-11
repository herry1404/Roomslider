import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { MapPin, X } from "lucide-react";
import api from "../../api/axios";
import "leaflet/dist/leaflet.css";

const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const makeIcon = (color) =>
  L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

const categoryIcons = {
  Room: makeIcon("blue"),
  PG: makeIcon("green"),
  Hostel: makeIcon("orange"),
  Flat: makeIcon("violet"),
};
const defaultIcon = makeIcon("grey");

const filters = [
  { key: "all", label: "All" },
  { key: "Room", label: "Rooms" },
  { key: "PG", label: "PG" },
  { key: "Hostel", label: "Hostels" },
  { key: "Flat", label: "Flats" },
];

const INDORE_CENTER = [22.7196, 75.8577];

function MapExplorer() {
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/rooms", {});
        setRooms(data.rooms || []);
      } catch (err) {
        console.error("Map fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const withCoords = rooms.filter((r) => r.latitude && r.longitude);
  const visibleRooms =
    filter === "all" ? withCoords : withCoords.filter((r) => r.category === filter);

  return (
    <div>
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
        .map-collapsed-box {
          animation: mapBannerFade 0.3s ease-out;
          transition: filter 0.2s ease;
        }
        .map-collapsed-box:hover .map-collapsed-overlay {
          background: rgba(255, 255, 255, 0.55);
        }
        .map-expand-wrap {
          overflow: hidden;
          max-height: ${showMap ? "500px" : "0px"};
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
        <div
          className="map-collapsed-box"
          onClick={() => setShowMap(true)}
          style={{
            position: "relative",
            height: "250px",
            borderRadius: "20px",
            overflow: "hidden",
            cursor: "pointer",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}>
            <MapContainer
              center={INDORE_CENTER}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
              dragging={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              touchZoom={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </MapContainer>
          </div>

          <div
            className="map-collapsed-overlay"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "rgba(255, 255, 255, 0.4)",
              transition: "background 0.2s ease",
            }}
          >
            <MapPin size={28} color="#ef4444" className="map-pin-icon" />
            <span style={{ fontSize: "15px", fontWeight: 600, color: "#16a34a" }}>
              Click here for map view
            </span>
          </div>
        </div>
      )}

      <div className="map-expand-wrap">
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "8px 18px",
                borderRadius: "999px",
                fontSize: "14px",
                fontWeight: 600,
                border: filter === f.key ? "none" : "1px solid var(--color-border)",
                background: filter === f.key ? "var(--color-primary)" : "var(--color-surface)",
                color: filter === f.key ? "#fff" : "var(--color-text)",
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", height: "420px", borderRadius: "20px", overflow: "hidden" }}>
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
            <MapContainer center={INDORE_CENTER} zoom={12} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {visibleRooms.map((room) => (
                <Marker
                  key={room._id}
                  position={[room.latitude, room.longitude]}
                  icon={categoryIcons[room.category] || defaultIcon}
                >
                  <Popup>
                    <strong>{room.title}</strong>
                    <br />
                    {room.category}
                    <br />
                    ₹{room.price}/month
                    <br />
                    <Link to={`/rooms/${room._id}`}>View details</Link>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {!loading && visibleRooms.length === 0 && (
          <p style={{ marginTop: "12px", color: "var(--color-text-light)", fontSize: "14px" }}>
            No listings with map coordinates yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default MapExplorer;