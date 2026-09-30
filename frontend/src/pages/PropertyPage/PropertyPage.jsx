import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import api from "../../api/axios";
import { roomPath } from "../../utils/roomUrl";

const card = {
  background: "var(--color-surface-2, #fff)",
  border: "1px solid rgba(128,128,128,0.25)",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "16px",
};

function PropertyPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const highlight = (searchParams.get("sharing") || "").toLowerCase();

  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/properties/${id}`)
      .then((res) => {
        if (!active) return;
        setProperty(res.data?.property || null);
        setRooms(res.data?.rooms || []);
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div style={{ padding: "24px" }}>Loading...</div>;
  }

  if (notFound || !property) {
    return <div style={{ padding: "24px" }}>Property not found.</div>;
  }

  // sharingType ke hisaab se groups
  const groups = {};
  rooms.forEach((r) => {
    const key = r.sharingType || "Rooms";
    (groups[key] = groups[key] || []).push(r);
  });
  const order = ["Single", "Double", "Triple", "Other", "Rooms"];
  const keys = Object.keys(groups).sort(
    (a, b) => order.indexOf(a) - order.indexOf(b)
  );

  const heroImage = rooms[0]?.images?.[0];
  const title = `${property.name} - ${property.propertyType} in ${property.area} | RoomSlider`;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "16px" }}>
      <Helmet>
        <title>{title}</title>
        <meta
          name="description"
          content={`${property.name} in ${property.area}, Indore. See sharing options, prices and vacant rooms.`}
        />
      </Helmet>

      {heroImage && (
        <img
          src={heroImage}
          alt={property.name}
          style={{
            width: "100%",
            maxHeight: "320px",
            objectFit: "cover",
            borderRadius: "12px",
            marginBottom: "16px",
          }}
        />
      )}

      <h1 style={{ margin: "0 0 4px" }}>{property.name}</h1>
      <p style={{ margin: "0 0 16px", opacity: 0.8 }}>
        {property.propertyType} · {property.area}
        {property.owner?.slug && (
          <>
            {" "}
            ·{" "}
            <Link to={`/owners/${property.owner.slug}`}>
              {property.owner.name}
            </Link>
          </>
        )}
      </p>

      {keys.length === 0 && (
        <div style={card}>No vacant rooms right now.</div>
      )}

      {keys.map((key) => {
        const list = groups[key];
        const minPrice = Math.min(...list.map((r) => r.price || 0));
        const isHi = highlight && key.toLowerCase() === highlight;
        return (
          <div
            key={key}
            style={{
              ...card,
              borderColor: isHi ? "var(--color-primary, #16a34a)" : card.border,
              borderWidth: isHi ? "2px" : "1px",
            }}
          >
            <h2 style={{ margin: "0 0 4px", fontSize: "18px" }}>
              {key === "Rooms" ? "Rooms" : `${key} sharing`}
            </h2>
            <p style={{ margin: "0 0 12px", opacity: 0.8 }}>
              From ₹{minPrice.toLocaleString()}/month · {list.length} vacant
            </p>

            {list.map((r) => (
              <Link
                key={r._id}
                to={roomPath(r)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderTop: "1px solid rgba(128,128,128,0.2)",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <span>{r.roomNumber ? `Room ${r.roomNumber}` : r.title}</span>
                <strong>₹{(r.price || 0).toLocaleString()}/month</strong>
              </Link>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default PropertyPage;
