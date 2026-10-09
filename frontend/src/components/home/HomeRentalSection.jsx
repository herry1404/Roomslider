import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import api from "../../api/axios";
import HourlyRoomCard from "../ui/HourlyRoomCard";
import SkeletonRoomCard from "../ui/SkeletonRoomCard";
import VillaCard from "./VillaCard";
import "../../styles/villas.css";

function HomeRentalSection({ type, title }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const isVilla = type === "villas";

  useEffect(() => {
    const controller = new AbortController();
    const request = isVilla
      ? api.get("/villas/public", { signal: controller.signal })
      : api.get("/hourly-rooms/public", { signal: controller.signal });
    request
      .then((response) => setItems(isVilla ? response.data.villas || [] : response.data || []))
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error(`LOAD ${type.toUpperCase()} HOME SECTION ERROR:`, error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [type, isVilla]);

  return (
    <section className="latest-rooms">
      <div className="container">
        <div className="section-header">
          <h2>{isVilla ? title : "Hourly / Short Stay"}</h2>
          {!loading && <Link className="view-all" to={isVilla ? "/villas" : "/hourly-rooms"}>
            View All <ArrowRight size={16} />
          </Link>}
        </div>
        {loading ? (
          isVilla
            ? <div className="rooms-grid home-rental-skeleton" aria-label={`Loading ${title}`}>
                {Array.from({ length: 6 }, (_, index) => <SkeletonRoomCard key={`${type}-${index}`} />)}
              </div>
            : <div className="hourly-listings-row hourly-listings-skeleton" aria-label={`Loading ${title}`}>
                {Array.from({ length: 5 }, (_, index) => <div className="hourly-listing-skeleton" key={`${type}-${index}`} />)}
              </div>
        ) : items.length === 0 ? (
          <p className="hourly-listings-empty">{isVilla ? "No stays available right now." : "No hourly stays available right now."}</p>
        ) : (
          <div className={isVilla ? "villa-grid" : "hourly-listings-row"}>
            {items.slice(0, 8).map((item) =>
              isVilla
                ? <VillaCard key={item._id} villa={item} />
                : <HourlyRoomCard key={item._id} room={item} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeRentalSection;
