import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import RoomCard from "../../components/ui/RoomCard";

function Rooms() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    setLoading(true);

    try {
      const params = search ? { search } : { category: "Room" };

      const response = await api.get("/rooms", { params });
      setRooms(response.data.rooms);
    } catch (error) {
      console.error("Rooms Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
        <title>Rooms for Rent in Indore | RoomSlider</title>
        <meta name="description" content="Browse verified rooms for rent in Indore. Compare prices, locations and amenities. Find your perfect room with RoomSlider." />
        <link rel="canonical" href="https://roomslider.in/rooms" />
      </Helmet>

    <section className="container" style={{ padding: "40px 0" }}>
      <h1>{search ? `Search results for "${search}"` : "Available Rooms"}</h1>
      <p>
        {search
          ? `${rooms.length} listing(s) found`
          : "Find your perfect accommodation."}
      </p>

      {rooms.length === 0 ? (
        <h3 style={{ marginTop: "30px" }}>No listings found</h3>
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

export default Rooms;