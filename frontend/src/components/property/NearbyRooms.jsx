import { useEffect, useState } from "react";
import api from "../../api/axios";
import CategorySection from "../home/CategorySection";

function NearbyRooms({ roomId, location }) {
  const [rooms, setRooms] = useState([]);
  const [nearestPlace, setNearestPlace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchNearby = async () => {
      try {
        const { data } = await api.get(`/rooms/${roomId}/nearby`);
        if (active) {
          setRooms(data.rooms || []);
          setNearestPlace(data.nearestPlace || null);
        }
      } catch (err) {
        console.error("Nearby Rooms Error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchNearby();

    return () => {
      active = false;
    };
  }, [roomId]);

  if (loading || rooms.length === 0) return null;

  const title = nearestPlace
    ? `Rooms near ${nearestPlace}`
    : `More rooms near ${location}`;

  return (
    <CategorySection
      title={title}
      viewAllPath="/rooms"
      rooms={rooms}
    />
  );
}

export default NearbyRooms;
