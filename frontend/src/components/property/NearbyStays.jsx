import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import RoomCard from "../ui/RoomCard";

function NearbyStays({ room }) {
  const [result, setResult] = useState(null);
  const rowRef = useRef(null);

  useEffect(() => {
    let active = true;
    api.get(`/rooms/${room._id}/nearby`)
      .then(({ data }) => {
        if (!active) return;
        const stays = (data.rooms || [])
          .filter((stay) => String(stay._id) !== String(room._id) && stay.category === room.category)
          .slice(0, 8);
        setResult({ id: room._id, rooms: stays });
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error.response?.data?.message || "Nearby stays could not be loaded");
        setResult({ id: room._id, rooms: [] });
      });
    return () => { active = false; };
  }, [room._id, room.category]);

  const rooms = result?.id === room._id ? result.rooms : [];
  if (!rooms.length) return null;

  const scroll = (direction) => {
    rowRef.current?.scrollBy({ left: direction * 300, behavior: "smooth" });
  };

  return (
    <section className="pd-nearby-stays">
      <header>
        <h2>More stays nearby</h2>
        <div className="pd-nearby-controls">
          <button type="button" onClick={() => scroll(-1)} aria-label="Scroll nearby stays left">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Scroll nearby stays right">
            <ChevronRight size={18} />
          </button>
        </div>
      </header>
      <div className="pd-nearby-row" ref={rowRef}>
        {rooms.map((stay) => (
          <div className="pd-nearby-card" key={stay._id}>
            <RoomCard room={stay} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default NearbyStays;
