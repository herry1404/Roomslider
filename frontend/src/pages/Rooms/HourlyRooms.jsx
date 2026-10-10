import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import HourlyRoomCard from "../../components/ui/HourlyRoomCard";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";
import SEO, { PAGE_SEO } from "../../components/SEO";

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
      <SEO
        {...PAGE_SEO.shortStays}
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Short Stays in Indore", path: "/hourly-rooms" }]}
      />

      <section className="container hourly-rooms-page">
        <h1>Hourly Rooms and Short Stays in Indore</h1>
        <p>
          Find a short stay in Indore for a few hours or overnight, with rooms
          that show their location, facilities and booking details. Compare
          options near Vijay Nagar, Bhawarkua, Vishnupuri, Indrapuri, Sarvanand
          Nagar and Vidhya Nagar, or places convenient to DAVV, IIM Indore,
          Medicaps, IPS Academy and Holkar College. Check the photos and hourly
          rates on each listing, then confirm availability for your dates
          before booking through RoomSlider.
        </p>

        {rooms.length === 0 ? (
          <h2 className="hourly-rooms-empty">No listings found</h2>
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
