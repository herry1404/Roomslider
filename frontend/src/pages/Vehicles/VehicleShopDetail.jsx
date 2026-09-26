import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MapPin, Phone, MessageCircle } from "lucide-react";
import api from "../../api/axios";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";
import "../../styles/vehicles.css";

const waLink = (phone, text) => {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

function VehicleShopDetail() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [shopsRes, vehiclesRes] = await Promise.all([
          api.get("/vehicle-shops"),
          api.get(`/vehicles/shop/${id}`),
        ]);
        const shops = Array.isArray(shopsRes.data)
          ? shopsRes.data
          : shopsRes.data?.shops || [];
        setShop(shops.find((s) => s._id === id) || null);
        setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : []);
      } catch (error) {
        console.error("Vehicle shop fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="container vehicle-page">
        <div className="skeleton-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRoomCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container vehicle-page">
        <h3>Shop not found</h3>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{shop.shopName} - Vehicle Rental | RoomSlider</title>
      </Helmet>

      <section className="container vehicle-page">
        <div className="vehicle-shop-head">
          <h1 style={{ margin: 0 }}>{shop.shopName}</h1>
          <div className="vehicle-meta">
            <MapPin size={14} /> {shop.address}, {shop.city}
          </div>
          <div className="vehicle-actions">
            <a className="vehicle-btn call" href={`tel:${shop.contactNumber}`}>
              <Phone size={16} /> Call
            </a>
            <a
              className="vehicle-btn wa"
              href={waLink(shop.contactNumber, `Hi, I found ${shop.shopName} on RoomSlider. I want to rent a vehicle.`)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
          </div>
        </div>

        <h2 style={{ marginBottom: 16 }}>Available Vehicles</h2>

        {vehicles.length === 0 ? (
          <h3>No vehicles listed yet</h3>
        ) : (
          <div className="vehicle-grid">
            {vehicles.map((v) => (
              <div key={v._id} className="vehicle-card">
                <div className="vehicle-card-body">
                  <h3>{v.name}</h3>
                  <div>
                    <span className="vehicle-badge">{v.type}</span>{" "}
                    <span className={`vehicle-badge ${v.available ? "" : "off"}`}>
                      {v.available ? v.availabilityNote || "Available now" : "Not available"}
                    </span>
                  </div>
                  <div className="vehicle-meta">Fuel: {v.fuel} · Limit: {v.kmLimit}</div>
                  <div className="vehicle-meta">Documents: {v.docRequired}</div>

                  <div className="vehicle-prices">
                    <div className="vehicle-price"><strong>₹{v.pricePerHour}</strong>/hour</div>
                    <div className="vehicle-price"><strong>₹{v.pricePerDay}</strong>/day</div>
                    <div className="vehicle-price"><strong>₹{v.pricePerMonth}</strong>/month</div>
                  </div>
                  <div className="vehicle-meta">Deposit: ₹{v.deposit}</div>

                  {v.available && (
                    <a
                      className="vehicle-btn wa"
                      href={waLink(shop.contactNumber, `Hi, I saw ${v.name} at ${shop.shopName} on RoomSlider. I want to rent it.`)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ justifyContent: "center", marginTop: 6 }}
                    >
                      <MessageCircle size={16} /> Rent on WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default VehicleShopDetail;
