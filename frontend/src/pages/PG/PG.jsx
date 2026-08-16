import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import api from "../../api/axios";
import RoomCard from "../../components/ui/RoomCard";

function PG() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const response = await api.get("/rooms", {
        params: { category: "PG" },
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
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>PG Accommodations in Indore | RoomSlider</title>
        <meta name="description" content="Find verified PG accommodations in Indore for students and professionals. Affordable, safe and hassle-free PG listings on RoomSlider." />
        <link rel="canonical" href="https://www.roomslider.in/pg" />
      </Helmet>

    <section className="container" style={{ padding: "40px 0" }}>
      <h1>PG Accommodations</h1>
      <p>Verified PGs for students and professionals.</p>

      {rooms.length === 0 ? (
        <h3 style={{ marginTop: "30px" }}>No listings available yet</h3>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: "25px",
            marginTop: "30px",
          }}
        >
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
