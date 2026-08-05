import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const filters = [
  { key: "all", label: "All" },
  { key: "Room", label: "Rooms" },
  { key: "PG", label: "PG" },
  { key: "Hostel", label: "Hostels" },
  { key: "Flat", label: "Flats" },
];

function MapExplorer() {
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const params = filter === "all" ? {} : { category: filter };
        const { data } = await api.get("/rooms", { params });
        setRooms(data.rooms || []);
      } catch (err) {
        console.error("Map fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [filter]);

  const withCoords = rooms.filter((r) => r.latitude && r.longitude);

  return (
    <div>
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

      <div style={{ height: "420px", borderRadius: "20px", overflow: "hidden" }}>
        <MapContainer center={[22.7196, 75.8577]} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {withCoords.map((room) => (
            <Marker key={room._id} position={[room.latitude, room.longitude]} icon={icon}>
              <Popup>
                <strong>{room.title}</strong>
                <br />
                ₹{room.price}/month
                <br />
                <Link to={`/rooms/${room._id}`}>View details</Link>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {!loading && withCoords.length === 0 && (
        <p style={{ marginTop: "12px", color: "var(--color-text-light)", fontSize: "14px" }}>
          No listings with map coordinates yet.
        </p>
      )}
    </div>
  );
}

export default MapExplorer;
