import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import api from "../../api/axios";
import HourlyRoomCard from "../../components/ui/HourlyRoomCard";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";

function HourlyRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get("/hourly-rooms/public")
      .then(({ data }) => {
        if (active) setRooms(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (active) {
          toast.error(error.response?.data?.message || "Hourly rooms could not be loaded");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="container hourly-rooms-page">
        <div className="skeleton-grid hourly-rooms-grid">
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
        <title>Hourly / Short Stay in Indore | RoomSlider</title>
        <meta name="description" content="Book rooms by the hour in Indore. Verified hourly rooms with RoomSlider." />
        <link rel="canonical" href="https://www.roomslider.in/hourly-rooms" />
      </Helmet>

      <section className="container hourly-rooms-page">
        <h1>Hourly / Short Stay</h1>
        <p>Ghante ke hisaab se book karo — verified rooms Indore mein.</p>

        {rooms.length === 0 ? (
          <h3 className="hourly-rooms-empty">No listings found</h3>
        ) : (
          <div className="hourly-rooms-grid">
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
