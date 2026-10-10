import { useEffect, useState } from "react";
import SEO, { PAGE_SEO } from "../../components/SEO";
import api from "../../api/axios";
import RoomCard from "../../components/ui/RoomCard";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";

function Hostels() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const response = await api.get("/rooms", {
        params: { category: "Hostel", hourly: "false" },
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
        {...PAGE_SEO.hostels}
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Hostels in Indore", path: "/hostels" }]}
      />
      <h1>Hostels in Indore for Students</h1>
      <p>
        Compare student hostels in Indore by location, rent, facilities and
        room photos before arranging a visit. Browse options around Vijay
        Nagar, Bhawarkua, Vishnupuri, Indrapuri, Sarvanand Nagar and Vidhya
        Nagar, including places convenient to DAVV, IIM Indore, Medicaps, IPS
        Academy and Holkar College. Listings may suit students and working
        professionals looking for girls' or boys' accommodation. Check the
        details that matter to you, then contact the property owner directly
        through RoomSlider.
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

export default Hostels;
