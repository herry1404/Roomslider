import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MapPin, Phone, ShieldCheck } from "lucide-react";
import api from "../../api/axios";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";
import { thumb } from "../../utils/imageThumb";
import "../../styles/vehicles.css";

function VehicleList() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/vehicle-shops");
        const data = Array.isArray(res.data) ? res.data : res.data?.shops || [];
        setShops(data);
      } catch (error) {
        console.error("Vehicle shops fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="container vehicle-page">
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
        <title>Rent a Bike or Scooty in Indore | RoomSlider</title>
        <meta
          name="description"
          content="Rent scooty, bike, electric vehicles and cycles in Indore. Hourly, daily and monthly prices."
        />
      </Helmet>

      <section className="container vehicle-page">
        <h1>Rent a Vehicle</h1>
        <p className="vehicle-sub">Scooty, bike, electric and cycle rentals near you</p>

        {shops.length === 0 ? (
          <h3>No vehicle shops found yet</h3>
        ) : (
          <div className="vehicle-grid">
            {shops.map((shop) => (
              <Link
                key={shop._id}
                to={`/vehicles/shop/${shop._id}`}
                className="vehicle-card"
              >
                {shop.images?.[0] ? (
                  <img
                    src={thumb(shop.images[0])}
                    alt={shop.shopName}
                    className="vehicle-card-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="vehicle-card-img" />
                )}
                <div className="vehicle-card-body">
                  <h3>{shop.shopName}</h3>
                  <div className="vehicle-meta">
                    <MapPin size={14} /> {shop.address}, {shop.city}
                  </div>
                  <div className="vehicle-meta">
                    <Phone size={14} /> {shop.contactNumber}
                  </div>
                  {shop.isVerified && (
                    <span className="vehicle-badge">
                      <ShieldCheck size={12} style={{ verticalAlign: "-2px" }} /> Verified
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default VehicleList;
