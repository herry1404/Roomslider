import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Shirt, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/laundry.css";

function LaundryList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nearby, setNearby] = useState(false);

  useEffect(() => {
    let active = true;
    const loadVendors = async (coords) => {
      try {
        const params = coords
          ? { lat: coords.latitude, lng: coords.longitude }
          : undefined;
        const response = await api.get("/laundry-vendors/public", { params });
        if (active) {
          setVendors(response.data.vendors || []);
          setNearby(Boolean(coords));
        }
      } catch (error) {
        if (active) toast.error(error.response?.data?.message || "Laundry list load nahi hui");
      } finally {
        if (active) setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => loadVendors(position.coords),
        () => loadVendors()
      );
    } else {
      loadVendors();
    }

    return () => { active = false; };
  }, []);

  return (
    <section className="container laundry-page">
      <Helmet>
        <title>Laundry Near You | RoomSlider</title>
        <meta name="description" content="Find public laundry services near your location and order directly on WhatsApp." />
      </Helmet>
      <header className="laundry-page-heading">
        <span className="laundry-eyebrow"><Shirt size={17} /> LAUNDRY SERVICES</span>
        <h1>Laundry near you</h1>
        <p><MapPin size={16} />{nearby ? "Nearby laundries are shown first" : "Showing all available laundries"}</p>
      </header>

      {loading ? (
        <p className="laundry-empty">Finding laundry profiles...</p>
      ) : vendors.length === 0 ? (
        <p className="laundry-empty">Abhi laundry profiles add nahi ki gayi hain.</p>
      ) : (
        <div className="laundry-vendor-grid">
          {vendors.map((vendor) => (
            <article className="laundry-vendor-card" key={vendor._id}>
              <div className="laundry-vendor-icon"><Shirt size={24} /></div>
              <div className="laundry-vendor-copy">
                <h2>{vendor.vendorName}</h2>
                <p><MapPin size={14} />{[vendor.area, vendor.address].filter(Boolean).join(", ")}</p>
                <span>{vendor.catalog?.length || 0} priced services</span>
              </div>
              <Link to={`/laundry/${vendor.slug || vendor.vendorName}`} aria-label={`View ${vendor.vendorName}`} className="laundry-card-link">
                <ArrowRight size={18} />
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default LaundryList;
