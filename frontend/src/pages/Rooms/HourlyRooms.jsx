import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import api from "../../api/axios";
import HourlyRoomCard from "../../components/ui/HourlyRoomCard";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";

function HourlyRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await api.get("/hourly-rooms/public");
      setRooms(response.data);
    } catch (error) {
      console.error("Hourly Rooms Fetch Error:", error);
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
      <Helmet>
        <title>Hourly Rooms in Indore | RoomSlider</title>
        <meta name="description" content="Book rooms by the hour in Indore. Verified hourly rooms with RoomSlider." />
        <link rel="canonical" href="https://www.roomslider.in/hourly-rooms" />
      </Helmet>

      <section className="container" style={{ padding: "40px 0" }}>
        <h1>Hourly Rooms</h1>
        <p>Ghante ke hisaab se book karo — verified rooms Indore mein.</p>

        {rooms.length === 0 ? (
          <h3 style={{ marginTop: "30px" }}>No listings found</h3>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: "25px",
              marginTop: "30px",
            }}
          >
            {rooms.map((room) => (
              <HourlyRoomCard key={room._id} room={room} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default HourlyRooms;
