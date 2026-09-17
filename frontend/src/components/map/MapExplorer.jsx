import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { Link } from "react-router-dom";
import { MapPin, X, LocateFixed } from "lucide-react";
import api from "../../api/axios";
import indoreColleges from "../../data/indoreColleges";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

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

const userLocationIcon = L.divIcon({
  className: "user-location-marker",
  html: '<div class="user-location-dot"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const collegePinSvg = `
<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 0C7.6 0 0 7.6 0 17c0 11.5 17 27 17 27s17-15.5 17-27C34 7.6 26.4 0 17 0z" fill="#1d4ed8"/>
  <circle cx="17" cy="17" r="11" fill="#ffffff"/>
  <path d="M17 10l-8 3.6 8 3.6 6.5-2.9v4.3h1.3v-5l-7.8-3.6z" fill="#111827"/>
  <path d="M11.5 15.4v3.4c0 1.5 2.5 2.7 5.5 2.7s5.5-1.2 5.5-2.7v-3.4L17 17.3l-5.5-1.9z" fill="#111827"/>
</svg>`;

const collegeIcon = L.divIcon({
  className: "college-marker",
  html: collegePinSvg,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
  popupAnchor: [0, -40],
});

const messPinSvg = `
<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 0C7.6 0 0 7.6 0 17c0 11.5 17 27 17 27s17-15.5 17-27C34 7.6 26.4 0 17 0z" fill="#f97316"/>
  <circle cx="17" cy="17" r="11" fill="#ffffff"/>
  <g stroke="#111827" stroke-width="1.4" stroke-linecap="round" fill="none">
    <line x1="12" y1="10" x2="12" y2="24" />
    <line x1="10" y1="10" x2="10" y2="15" />
    <line x1="14" y1="10" x2="14" y2="15" />
    <path d="M10 15c0 1.1 0.9 2 2 2s2-0.9 2-2" />
    <path d="M22 10c-2 0-3 2-3 4.5S21 18 21 18v6" />
  </g>
</svg>`;

const messIcon = L.divIcon({
  className: "mess-marker",
  html: messPinSvg,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
  popupAnchor: [0, -40],
});

const filters = [
  { key: "all", label: "All" },
  { key: "Room", label: "Rooms" },
  { key: "PG", label: "PG" },
  { key: "Hostel", label: "Hostels" },
  { key: "Flat", label: "Flats" },
];

const INDORE_CENTER = [22.7196, 75.8577];

const INDIA_BOUNDS = [
  [6.0, 68.0],
  [37.5, 97.5],
];

function LocateButton({ onLocate }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleClick = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 15);
        onLocate([latitude, longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <button
      onClick={handleClick}
      className="map-locate-btn"
      style={{
        position: "absolute",
        bottom: "16px",
        right: "12px",
        zIndex: 1000,
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      <LocateFixed
        size={20}
        color="var(--color-primary)"
        style={locating ? { animation: "mapLocatePulse 1s ease-in-out infinite" } : undefined}
      />
    </button>
  );
}

function AutoLocate({ onLocate }) {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 15);
        onLocate([latitude, longitude]);
      },
      () => {
        // location denied/unavailable — stay on default Indore center
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function MapExplorer({ startExpanded = false, allowCollapse = true, fullscreen = false }) {
  const [rooms, setRooms] = useState([]);
  const [messes, setMesses] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(startExpanded);
  const [userPos, setUserPos] = useState(null);
  const [showColleges, setShowColleges] = useState(false);
  const [showMess, setShowMess] = useState(false);

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

  useEffect(() => {
    const fetchMess = async () => {
      try {
        const { data } = await api.get("/mess/nearby");
        setMesses(data || []);
      } catch (err) {
        console.error("Mess fetch error:", err);
      }
    };
    fetchMess();
  }, []);

  const withCoords = rooms.filter((r) => r.latitude && r.longitude);
  const visibleRooms =
    filter === "all" ? withCoords : withCoords.filter((r) => r.category === filter);

  const messWithCoords = messes.filter(
    (m) => m.location?.coordinates?.length === 2
  );

  if (fullscreen) {
    return (
      <div className="map-fullscreen-wrap">
        <style>{`
          .map-fullscreen-wrap {
            position: relative;
            width: 100%;
            height: calc(100vh - var(--navbar-height));
            overflow: hidden;
          }
          .map-fullscreen-filters {
            position: absolute;
            top: 12px;
            left: 0;
            right: 0;
            display: flex;
            gap: 8px;
            padding: 0 12px;
            overflow-x: auto;
            z-index: 1000;
            scrollbar-width: none;
          }
          .map-fullscreen-filters::-webkit-scrollbar {
            display: none;
          }
          .map-fullscreen-pill {
            flex-shrink: 0;
            padding: 8px 16px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
            box-shadow: 0 1px 6px rgba(0,0,0,0.15);
          }
          .map-fullscreen-empty {
            position: absolute;
            bottom: 16px;
            left: 12px;
            right: 12px;
            text-align: center;
            padding: 10px;
            border-radius: 12px;
            font-size: 13px;
            z-index: 1000;
            box-shadow: 0 1px 6px rgba(0,0,0,0.15);
          }
          .user-location-dot {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #4285F4;
            border: 2px solid white;
            box-shadow: 0 0 0 4px rgba(66,133,244,0.35);
          }
          @keyframes mapLocatePulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
          .marker-cluster-custom {
            background: rgba(37, 99, 235, 0.85);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-weight: 700;
            font-size: 13px;
            border: 2px solid white;
            box-shadow: 0 1px 6px rgba(0,0,0,0.3);
          }
        `}</style>

        <div className="map-fullscreen-filters">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="map-fullscreen-pill"
              style={{
                border: filter === f.key ? "none" : "1px solid var(--color-border)",
                background: filter === f.key ? "var(--color-primary)" : "var(--color-surface)",
                color: filter === f.key ? "#fff" : "var(--color-text)",
              }}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => setShowColleges((v) => !v)}
            className="map-fullscreen-pill"
            style={{
              border: showColleges ? "none" : "1px solid var(--color-border)",
              background: showColleges ? "#1e293b" : "var(--color-surface)",
              color: showColleges ? "#fff" : "var(--color-text)",
            }}
          >
            🎓 Colleges
          </button>
          <button
            onClick={() => setShowMess((v) => !v)}
            className="map-fullscreen-pill"
            style={{
              border: showMess ? "none" : "1px solid var(--color-border)",
              background: showMess ? "#f97316" : "var(--color-surface)",
              color: showMess ? "#fff" : "var(--color-text)",
            }}
          >
            🍴 Mess
          </button>
        </div>

        <MapContainer
          className="leaflet-map-wrapper"
          center={INDORE_CENTER}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          attributionControl={false}
          maxBounds={INDIA_BOUNDS}
          maxBoundsViscosity={1.0}
          minZoom={5}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <AutoLocate onLocate={setUserPos} />
          <LocateButton onLocate={setUserPos} />

          {userPos && (
            <Marker position={userPos} icon={userLocationIcon}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {showColleges &&
            indoreColleges.map((college) => (
              <Marker
                key={college.name}
                position={[college.latitude, college.longitude]}
                icon={collegeIcon}
              >
                <Popup>
                  <strong>{college.name}</strong>
                  <br />
                  {college.address}
                </Popup>
              </Marker>
            ))}

          {showMess &&
            messWithCoords.map((mess) => (
              <Marker
                key={mess._id}
                position={[mess.location.coordinates[1], mess.location.coordinates[0]]}
                icon={messIcon}
              >
                <Popup>
                  <strong>{mess.name}</strong>
                  <br />
                  {mess.address}
                  <br />
                  ₹{mess.pricePerPerson}/thali
                  <br />
                  <Link to={`/mess/${mess._id}`}>View details</Link>
                </Popup>
              </Marker>
            ))}

          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={(cluster) =>
              L.divIcon({
                html: `<div class="marker-cluster-custom" style="width:38px;height:38px;">${cluster.getChildCount()}</div>`,
                className: "",
                iconSize: [38, 38],
              })
            }
          >
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
          </MarkerClusterGroup>
        </MapContainer>

        {!loading && visibleRooms.length === 0 && (
          <div
            className="map-fullscreen-empty"
            style={{ background: "var(--color-surface)", color: "var(--color-text-light)" }}
          >
            No listings with map coordinates yet.
          </div>
        )}
      </div>
    );
  }

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
            border: "1px solid var(--color-border)",
          }}
        >
          <div style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}>
            <MapContainer
              className="leaflet-map-wrapper"
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
              background: "var(--color-surface)",
              opacity: 0.85,
              transition: "background 0.2s ease",
            }}
          >
            <MapPin size={28} color="#ef4444" className="map-pin-icon" />
            <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-primary)" }}>
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
          {allowCollapse && (
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
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                cursor: "pointer",
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }}
            >
              <X size={16} color="var(--color-text)" />
            </button>
          )}

          {showMap && (
            <MapContainer className="leaflet-map-wrapper" center={INDORE_CENTER} zoom={12} style={{ height: "100%", width: "100%" }}>
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
