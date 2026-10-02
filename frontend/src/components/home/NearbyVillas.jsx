import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import VillaCard from "./VillaCard";
import { distanceKm } from "../../utils/indoreLocation";

function NearbyVillas({ villa }) {
  const [result, setResult] = useState(null);
  const coordinates = villa.location?.coordinates || [];
  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  useEffect(() => {
    let active = true;
    api.get("/villas/public", {
      params: hasCoordinates ? { lat: latitude, lng: longitude } : undefined,
    })
      .then(({ data }) => {
        if (!active) return;
        const nearby = (data?.villas || [])
          .filter((item) => String(item._id) !== String(villa._id))
          .map((item) => {
            const itemCoordinates = item.location?.coordinates || [];
            const itemDistance = hasCoordinates
              ? distanceKm(latitude, longitude, itemCoordinates[1], itemCoordinates[0])
              : null;
            const sameCity = item.city?.toLowerCase() === villa.city?.toLowerCase();
            return { ...item, nearbyDistanceKm: itemDistance, sameCity };
          })
          .filter((item) => hasCoordinates
            ? Number.isFinite(item.nearbyDistanceKm)
            : item.sameCity || item.area?.toLowerCase() === villa.area?.toLowerCase())
          .sort((left, right) => {
            if (hasCoordinates) return left.nearbyDistanceKm - right.nearbyDistanceKm;
            return Number(right.sameCity) - Number(left.sameCity);
          })
          .slice(0, 8);
        setResult({ id: villa._id, villas: nearby });
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error.response?.data?.message || "Nearby villas could not be loaded");
        setResult({ id: villa._id, villas: [] });
      });
    return () => {
      active = false;
    };
  }, [hasCoordinates, latitude, longitude, villa._id, villa.area, villa.city]);

  const villas = result?.id === villa._id ? result.villas : [];
  if (!villas.length) return null;

  return (
    <section className="villa-nearby-section">
      <header>
        <h2>Nearby villas</h2>
        {villa.area && <p>Other places to stay near {villa.area}</p>}
      </header>
      <div className="villa-nearby-grid">
        {villas.map((item) => (
          <VillaCard key={item._id} villa={item} distanceKm={item.nearbyDistanceKm} />
        ))}
      </div>
    </section>
  );
}

export default NearbyVillas;
