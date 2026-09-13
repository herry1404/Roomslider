import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { MapPin } from "lucide-react";
import api from "../../api/axios";
import MessCard from "../../components/ui/MessCard";

function MessList() {
  const [messList, setMessList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState("locating"); // locating | found | denied

  const fetchMess = async (lat, lng) => {
    setLoading(true);
    try {
      const params = {};
      if (lat && lng) {
        params.lat = lat;
        params.lng = lng;
      }
      const res = await api.get("/mess/nearby", { params });
      setMessList(res.data || []);
    } catch (error) {
      console.error("Mess Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      fetchMess();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationStatus("found");
        fetchMess(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocationStatus("denied");
        fetchMess();
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: "40px 0" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mess Near You in Indore | RoomSlider</title>
        <meta
          name="description"
          content="Find mess and tiffin services near you in Indore. Daily menu, price per person, and easy ordering with RoomSlider."
        />
        <link rel="canonical" href="https://www.roomslider.in/mess" />
      </Helmet>

      <section className="container" style={{ padding: "40px 0" }}>
        <h1>Mess Near You</h1>

        <p style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-light)" }}>
          <MapPin size={16} />
          {locationStatus === "found"
            ? "Showing mess sorted by distance from your location"
            : "Enable location for nearest mess first — showing all mess for now"}
        </p>

        {messList.length === 0 ? (
          <h3 style={{ marginTop: "30px" }}>No mess found</h3>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: "25px",
              marginTop: "30px",
            }}
          >
            {messList.map((mess) => (
              <MessCard key={mess._id} mess={mess} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default MessList;
