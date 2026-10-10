import { useEffect, useState } from "react";
import SEO, { PAGE_SEO } from "../../components/SEO";
import api from "../../api/axios";
import RoomCard from "../../components/ui/RoomCard";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";

function Flats() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const response = await api.get("/rooms", {
        params: { category: "Flat", hourly: "false" },
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
        {...PAGE_SEO.flats}
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Flats in Indore", path: "/flats" }]}
      />
      <h1>Flats for Rent in Indore</h1>
      <p>
        Browse 1BHK, 2BHK and furnished flats for rent in Indore, comparing
        monthly prices, photos and the details provided by each owner. Explore
        homes near Vijay Nagar, Bhawarkua, Vishnupuri, Indrapuri, Sarvanand
        Nagar and Vidhya Nagar, with convenient access to DAVV, IIM Indore,
        Medicaps, IPS Academy and Holkar College. Whether you are moving for
        study, work or family, use the listing information to shortlist a
        suitable home and contact the owner directly through RoomSlider.
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

export default Flats;
