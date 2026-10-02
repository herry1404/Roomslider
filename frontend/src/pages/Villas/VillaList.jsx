import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import api from "../../api/axios";
import VillaCard from "../../components/home/VillaCard";
import "../../styles/villas.css";

function VillaList() {
  const [villas, setVillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nearby, setNearby] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async (coords) => {
      try {
        const response = await api.get("/villas/public", {
          params: coords ? { lat: coords.latitude, lng: coords.longitude } : undefined,
        });
        if (active) {
          setVillas(response.data.villas || []);
          setNearby(Boolean(coords));
        }
      } catch (error) {
        if (active) toast.error(error.response?.data?.message || "Villas load nahi hui");
      } finally {
        if (active) setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => load(position.coords),
        () => load()
      );
    } else {
      load();
    }
    return () => { active = false; };
  }, []);

  return (
    <main className="container villa-list-page">
      <Helmet>
        <title>Book Villas for Stays & Events | RoomSlider</title>
        <meta name="description" content="Browse villas for overnight stays and private events, check availability, and book online." />
      </Helmet>
      <header className="villa-page-heading">
        <h1>Villas for stays & events</h1>
        <p><MapPin size={15} /> {nearby ? "Showing villas sorted by distance" : "Browse available villas"}</p>
      </header>
      {loading ? <p>Loading villas...</p> : villas.length === 0 ? (
        <div className="villa-empty">Abhi villas available nahi hain.</div>
      ) : (
        <div className="villa-grid">{villas.map((villa) => <VillaCard key={villa._id} villa={villa} />)}</div>
      )}
    </main>
  );
}

export default VillaList;
