import { useEffect, useState } from "react";
import SEO, { PAGE_SEO } from "../../components/SEO";
import api from "../../api/axios";
import RoomCard from "../../components/ui/RoomCard";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";

function PG() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const response = await api.get("/rooms", {
        params: { category: "PG", hourly: "false" },
      });
      setRooms(response.data.rooms);
    } catch (error) {
      console.error("Rooms Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: "40px 0" }}>
        <div className="skeleton-grid" style={{ marginTop: "30px" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonRoomCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
    <section className="container" style={{ padding: "40px 0" }}>
      <SEO
        {...PAGE_SEO.pg}
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "PG in Indore", path: "/pg" }]}
      />
      <h1>PG in Indore for Boys and Girls</h1>
      <p>
        Find a PG in Indore that fits your routine, budget and preferred sharing
        style. Students and working professionals can compare stays with food,
        WiFi, air conditioning and other facilities. Explore popular rental
        areas such as Vijay Nagar, Bhawarkua, Vishnupuri, Indrapuri, Sarvanand
        Nagar and Vidhya Nagar, with options near DAVV, IIM Indore, Medicaps,
        IPS Academy and Holkar College. Review listing photos and monthly rent
        before contacting an owner directly through RoomSlider.
      </p>

      {rooms.length === 0 ? (
        <h2 style={{ marginTop: "30px" }}>No listings available yet</h2>
      ) : (
        <div className="listing-grid">
          {rooms.map((room) => (
            <RoomCard key={room._id} room={room} />
          ))}
        </div>
      )}
    </section>
    </>
  );
}

export default PG;
