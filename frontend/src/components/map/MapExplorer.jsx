import { roomPath } from "../../utils/roomUrl";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { Link, useNavigate } from "react-router-dom";
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

const SCHOOL_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 9 12 5 2 9l10 4 10-4v6"/><path d="M6 10.6V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.4"/></svg>';

const getShortName = (c) => {
  if (c.short) return c.short;
  const m = c.name.match(/\(([^)]+)\)/);
  if (m) return m[1];
  const first = c.name.split(",")[0].trim();
  return first.length > 16 ? `${first.slice(0, 15)}…` : first;
};

const collegeIconCache = {};
const getCollegeIcon = (c) => {
  const label = getShortName(c);
  if (!collegeIconCache[label]) {
    collegeIconCache[label] = L.divIcon({
      className: "rs-icon",
      html: `<div class="rs-college">${SCHOOL_SVG}<span>${label}</span></div>`,
      iconSize: [0, 0],
      popupAnchor: [0, -18],
    });
  }
  return collegeIconCache[label];
};

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

const MP_BOUNDS = [
  [20.9, 73.9],
  [27.0, 82.95],
];

const CATEGORY_COLORS = {
  Room: "#22c55e",
  PG: "#60a5fa",
  Hostel: "#f59e0b",
  Flat: "#ec4899",
};

const HOME_SVG =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>';

const formatPrice = (p) => {
  const n = Number(p) || 0;
  if (n < 1000) return `₹${n}`;
  return `₹${String(Math.round(n / 100) / 10).replace(/\.0$/, "")}k`;
};

const priceIconCache = {};
const getPriceIcon = (room, selected) => {
  const label = formatPrice(room.price);
  const color = CATEGORY_COLORS[room.category] || "#94a3b8";
  const key = `${color}|${label}|${selected}`;
  if (!priceIconCache[key]) {
    priceIconCache[key] = L.divIcon({
      className: "rs-icon",
      html: `<div class="rs-pill${selected ? " rs-pill-sel" : ""}" style="--c:${color}">${HOME_SVG}${label}</div>`,
      iconSize: [0, 0],
    });
  }
  return priceIconCache[key];
};

const makeClusterHtml = (count) =>
  `<div class="rs-pill rs-cluster${count >= 100 ? " rs-cluster-big" : ""}" style="--c:#22c55e">${HOME_SVG}${count}</div>`;

function LocateButton({ onLocate }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleClick = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!L.latLngBounds(MP_BOUNDS).contains([latitude, longitude])) {
          setLocating(false);
          return;
        }
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
        bottom: "132px",
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
        if (!L.latLngBounds(MP_BOUNDS).contains([latitude, longitude])) return;
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

const kmBetween = (a, b) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const orderByArea = (list, ref) => {
  const left = [...list];
  const out = [];
  let cur = ref;
  while (left.length) {
    let bi = 0;
    let bd = Infinity;
    for (let i = 0; i < left.length; i++) {
      const d = kmBetween(cur, [Number(left[i].latitude), Number(left[i].longitude)]);
      if (d < bd) {
        bd = d;
        bi = i;
      }
    }
    const [next] = left.splice(bi, 1);
    out.push(next);
    cur = [Number(next.latitude), Number(next.longitude)];
  }
  return out;
};

function ZoomClass({ threshold }) {
  const map = useMap();
  const apply = () =>
    map.getContainer().classList.toggle("rs-zoomed-out", map.getZoom() < threshold);
  useMapEvents({ zoomend: apply });
  useEffect(() => {
    apply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

const getRoomImage = (room) => {
  const first = Array.isArray(room.images) ? room.images[0] : room.image;
  const url = typeof first === "string" ? first : first?.url;
  return typeof url === "string" && url.startsWith("http") ? url : "";
};

function FlyToSelected({ room }) {
  const map = useMap();

  useEffect(() => {
    if (!room) return;
    const zoom = Math.max(map.getZoom(), 15);
    const pt = map.project([room.latitude, room.longitude], zoom).add([0, 35]);
    map.flyTo(map.unproject(pt, zoom), zoom, { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?._id]);

  return null;
}

function SelectedRoomCard({ room, onView }) {
  const map = useMap();
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!room) {
      setPos(null);
      return;
    }
    const update = () => {
      const pt = map.latLngToContainerPoint([room.latitude, room.longitude]);
      setPos({ x: pt.x, y: pt.y });
    };
    update();
    map.on("move zoom", update);
    return () => map.off("move zoom", update);
  }, [room, map]);

  if (!room || !pos) return null;

  const img = getRoomImage(room);

  return createPortal(
    <div
      className="rs-map-detail"
      style={{ left: pos.x, top: pos.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="rs-map-detail-thumb">
        {img ? <img src={img} alt="" /> : <MapPin size={20} />}
      </div>
      <div className="rs-map-detail-title">{room.title}</div>
      <div className="rs-map-detail-meta">
        {room.category}
        {room.gender && room.gender !== "Any" ? ` · ${room.gender}` : ""}
      </div>
      {room.address && (
        <div className="rs-map-detail-addr">
          <MapPin size={11} />
          {room.address}
        </div>
      )}
      <div className="rs-map-detail-footer">
        <span className="rs-map-detail-price">₹{room.price}/mo</span>
        <button onClick={() => onView(room)}>View</button>
      </div>
    </div>,
    map.getContainer()
  );
}

function LockToBounds({ bounds }) {
  const map = useMap();

  useEffect(() => {
    const apply = () => {
      map.invalidateSize();
      map.setMinZoom(map.getBoundsZoom(bounds, true));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(map.getContainer());
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

function ViewCounter({ rooms, onCount }) {
  const map = useMap();

  const update = () => {
    const b = map.getBounds();
    onCount(rooms.filter((r) => b.contains([r.latitude, r.longitude])).length);
  };

  useMapEvents({ moveend: update, zoomend: update });

  useEffect(() => {
    update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms.length, rooms[0]?._id]);

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
  const [selectedId, setSelectedId] = useState(null);
  const [inViewCount, setInViewCount] = useState(0);
  const rowRef = useRef(null);
  const lockRef = useRef(false);
  const navigate = useNavigate();

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

  let prefCollege = null;
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    prefCollege = indoreColleges.find((c) => c.name === u?.preferredCollege) || null;
  } catch {
    prefCollege = null;
  }
  const refPoint = prefCollege
    ? [prefCollege.latitude, prefCollege.longitude]
    : userPos || INDORE_CENTER;
  const refLabel = prefCollege ? getShortName(prefCollege) : userPos ? "you" : "city center";
  const cardRooms = orderByArea(visibleRooms, refPoint);
  const selectedRoom = cardRooms.find((r) => r._id === selectedId) || null;
  const CARD_STEP = 260;

  const scrollToCard = (idx) => {
    if (!rowRef.current || idx < 0) return;
    lockRef.current = true;
    rowRef.current.scrollTo({ left: idx * CARD_STEP, behavior: "smooth" });
    setTimeout(() => {
      lockRef.current = false;
    }, 700);
  };

  const selectRoom = (id) => {
    setSelectedId(id);
    scrollToCard(cardRooms.findIndex((r) => r._id === id));
  };

  const handleRowScroll = (e) => {
    if (lockRef.current || cardRooms.length === 0) return;
    const idx = Math.round(e.currentTarget.scrollLeft / CARD_STEP);
    const room = cardRooms[Math.max(0, Math.min(cardRooms.length - 1, idx))];
    if (room && room._id !== selectedId) setSelectedId(room._id);
  };

  const handleCardClick = (room) => {
    if (room._id === selectedId) navigate(roomPath(room));
    else selectRoom(room._id);
  };

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
          .rs-pill {
            position: absolute;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 5px 10px;
            border-radius: 999px;
            background: #0f172a;
            color: #fff;
            font-size: 12px;
            font-weight: 600;
            border: 1.5px solid var(--c, #22c55e);
            white-space: nowrap;
            cursor: pointer;
          }
          .rs-pill svg { color: var(--c, #22c55e); flex-shrink: 0; }
          .rs-row {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 16px;
            z-index: 1000;
            display: flex;
            gap: 10px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            padding: 0 calc(50% - 125px);
            scrollbar-width: none;
            pointer-events: none;
          }
          .rs-row::-webkit-scrollbar { display: none; }
          .map-fullscreen-wrap .leaflet-top.leaflet-right { margin-top: 56px; }
          .rs-count {
            position: absolute;
            left: 14px;
            bottom: 124px;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 999px;
            background: #22c55e;
            color: #052e16;
            font-size: 12px;
            font-weight: 600;
            pointer-events: none;
          }
          .rs-card {
            flex: 0 0 250px;
            scroll-snap-align: center;
            display: flex;
            gap: 10px;
            padding: 10px;
            border-radius: 16px;
            background: #0f172a;
            border: 1px solid #334155;
            color: #fff;
            cursor: pointer;
            pointer-events: auto;
          }
          .rs-card { user-select: none; -webkit-user-select: none; }
          .rs-card-sel { border: 1.5px solid #22c55e; }
          .rs-thumb {
            flex: 0 0 76px;
            height: 76px;
            border-radius: 12px;
            background: #1e293b;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
          }
          .rs-thumb img { width: 100%; height: 100%; object-fit: cover; }
          .rs-card-title { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .rs-card-meta { font-size: 12px; color: #94a3b8; margin-top: 2px; }
          .rs-card-price { margin-top: 8px; font-size: 14px; font-weight: 600; color: #22c55e; }
          .rs-map-detail {
            position: absolute;
            transform: translate(-50%, calc(-100% - 40px));
            width: 180px;
            background: #0f172a;
            border: 1.5px solid #22c55e;
            border-radius: 14px;
            padding: 10px;
            color: #fff;
            z-index: 1200;
            pointer-events: auto;
          }
          .rs-map-detail-thumb {
            width: 100%;
            height: 84px;
            border-radius: 10px;
            background: #1e293b;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            margin-bottom: 6px;
          }
          .rs-map-detail-thumb img { width: 100%; height: 100%; object-fit: cover; }
          .rs-map-detail-title { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .rs-map-detail-meta { font-size: 11px; color: #94a3b8; margin-top: 2px; }
          .rs-map-detail-addr {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #94a3b8;
            margin-top: 4px;
          }
          .rs-map-detail-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 8px;
          }
          .rs-map-detail-price { font-size: 14px; font-weight: 600; color: #22c55e; }
          .rs-map-detail-footer button {
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 999px;
            border: 1px solid #334155;
            background: transparent;
            color: #fff;
            cursor: pointer;
          }
          .rs-pill-sel { background: var(--c); color: #0b1220; border-color: #fff; z-index: 1000; }
          .rs-pill-sel svg { color: #0b1220; }
          body.dark .map-fullscreen-wrap .leaflet-marker-icon.rs-icon { filter: none; }
          .rs-cluster { font-size: 13px; padding: 6px 12px; }
          .rs-college {
            position: absolute;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            border-radius: 10px;
            background: #0f172a;
            border: 1.5px solid #a78bfa;
            color: #fff;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            cursor: pointer;
          }
          .rs-college svg { color: #a78bfa; flex-shrink: 0; }
          .leaflet-map-wrapper.rs-zoomed-out .rs-college span { display: none; }
          .leaflet-map-wrapper.rs-zoomed-out .rs-college { padding: 6px; border-radius: 8px; }
          .rs-cluster-big { background: #22c55e; color: #052e16; border-color: #22c55e; }
          .rs-cluster-big svg { color: #052e16; }
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
          zoomControl={false}
          maxBounds={MP_BOUNDS}
          maxBoundsViscosity={1.0}
          minZoom={6}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LockToBounds bounds={MP_BOUNDS} />
          <AutoLocate onLocate={setUserPos} />
          <FlyToSelected room={selectedRoom} />
          <SelectedRoomCard room={selectedRoom} onView={(r) => navigate(roomPath(r))} />
          <ZoomControl position="topright" />
          <ViewCounter rooms={visibleRooms} onCount={setInViewCount} />
          <ZoomClass threshold={13} />
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
                icon={getCollegeIcon(college)}
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
                html: makeClusterHtml(cluster.getChildCount()),
                className: "rs-icon",
                iconSize: [0, 0],
              })
            }
          >
            {visibleRooms.map((room) => (
              <Marker
                key={room._id}
                position={[room.latitude, room.longitude]}
                icon={getPriceIcon(room, room._id === selectedId)}
                zIndexOffset={room._id === selectedId ? 1000 : 0}
                eventHandlers={{ click: () => selectRoom(room._id) }}
              />
            ))}
          </MarkerClusterGroup>
        </MapContainer>

        {inViewCount > 0 && (
          <div className="rs-count">
            <MapPin size={13} />
            {inViewCount} {inViewCount === 1 ? "room" : "rooms"} in this area
          </div>
        )}

        {cardRooms.length > 0 && (
          <div className="rs-row" ref={rowRef} onScroll={handleRowScroll}>
            {cardRooms.map((room) => {
              const img = getRoomImage(room);
              return (
                <div
                  key={room._id}
                  className={`rs-card${room._id === selectedId ? " rs-card-sel" : ""}`}
                  onClick={() => handleCardClick(room)}
                >
                  <div className="rs-thumb">
                    {img ? <img src={img} alt="" loading="lazy" /> : <MapPin size={22} />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="rs-card-title">{room.title}</div>
                    <div className="rs-card-meta">
                      {room.category}
                      {room.gender && room.gender !== "Any" ? ` · ${room.gender}` : ""}
                    </div>
                    <div className="rs-card-price">₹{room.price}/mo</div>
                    <div className="rs-card-meta">
                      {kmBetween(refPoint, [Number(room.latitude), Number(room.longitude)]).toFixed(1)} km from {refLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
                    <Link to={roomPath(room)}>View details</Link>
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
