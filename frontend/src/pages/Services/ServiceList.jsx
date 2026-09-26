import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MapPin, Phone, MessageCircle } from "lucide-react";
import api from "../../api/axios";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";
import "../../styles/services.css";

const CATEGORY_META = {
  cleaning: { title: "Cleaning & Housekeeping", sub: "Room and bathroom cleaning near you" },
  packers: { title: "Packers & Movers", sub: "Easy shifting to your new place" },
  furniture: { title: "Furniture & Appliance Rental", sub: "Bed, cooler, AC, fridge on rent" },
  wifi: { title: "WiFi & RO Water", sub: "Broadband and RO purifier service" },
  "appliance-repair": { title: "Appliance Repair", sub: "Cooler, AC and geyser repair" },
};

const waLink = (phone, text) => {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

function ServiceList() {
  const { category } = useParams();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const meta = CATEGORY_META[category] || { title: "Services", sub: "" };

  useEffect(() => {
    setLoading(true);
    api
      .get(`/services/${category}`)
      .then((res) => setProviders(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Service fetch error:", err))
      .finally(() => setLoading(false));
  }, [category]);

  if (loading) {
    return (
      <div className="container service-page">
        <div className="skeleton-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRoomCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{meta.title} | RoomSlider</title>
        <meta name="description" content={meta.sub} />
      </Helmet>

      <section className="container service-page">
        <h1>{meta.title}</h1>
        <p className="service-sub">{meta.sub}</p>

        {providers.length === 0 ? (
          <h3>No providers found yet</h3>
        ) : (
          <div className="service-grid">
            {providers.map((p) => (
              <div key={p._id} className="service-card">
                <h3>{p.name}</h3>
                <div className="service-meta">
                  <MapPin size={14} /> {p.area}, {p.city}
                </div>
                {p.priceNote && <span className="service-price">{p.priceNote}</span>}
                {p.description && <p style={{ margin: 0, fontSize: 14 }}>{p.description}</p>}

                <div className="service-actions">
                  <a className="service-btn call" href={`tel:${p.contactNumber}`}>
                    <Phone size={16} /> Call
                  </a>
                  <a
                    className="service-btn wa"
                    href={waLink(p.contactNumber, `Hi, I found ${p.name} on RoomSlider for ${meta.title}.`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default ServiceList;
