import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import api from "../../api/axios";
import HourlyRoomCard from "../ui/HourlyRoomCard";
import VillaCard from "./VillaCard";
import "../../styles/villas.css";

function HomeRentalSection({ type, title }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const isVilla = type === "villas";

  useEffect(() => {
    const url = isVilla ? "/villas/public" : "/hourly-rooms/public";
    api.get(url)
      .then((response) => setItems(isVilla ? response.data.villas || [] : response.data || []))
      .catch((error) => console.error(`LOAD ${type.toUpperCase()} HOME SECTION ERROR:`, error))
      .finally(() => setLoading(false));
  }, [type, isVilla]);

  if (loading || items.length === 0) return null;

  return (
    <section className="latest-rooms">
      <div className="container">
        <div className="section-header">
          <h2>{title}</h2>
          <Link className="view-all" to={isVilla ? "/villas" : "/hourly-rooms"}>
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className={isVilla ? "villa-grid" : "rooms-grid"}>
          {items.slice(0, 8).map((item) =>
            isVilla
              ? <VillaCard key={item._id} villa={item} />
              : <HourlyRoomCard key={item._id} room={item} />
          )}
        </div>
      </div>
    </section>
  );
}

export default HomeRentalSection;
