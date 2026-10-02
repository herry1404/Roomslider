import { useEffect, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import VillaCard from "../../components/home/VillaCard";
import { distanceKm, findIndorePlace, normalizePlaceName } from "../../utils/indoreLocation";
import "../../styles/villas.css";

const VILLA_NEARBY_RADIUS_KM = 10;

function VillaList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = (searchParams.get("search") || "").trim();
  const [searchInput, setSearchInput] = useState(search);
  const [result, setResult] = useState(null);
  const loading = result?.search !== search;
  const nearby = result?.search === search && result.nearby;
  const villas = result?.search === search ? result.villas : [];
  const nearbyVillas = result?.search === search ? result.nearbyVillas || [] : [];

  useEffect(() => {
    let active = true;
    const show = (items, nearbyItems = [], placeName = "", nearestFallback = false) => {
      if (active) setResult({
        search,
        villas: items,
        nearbyVillas: nearbyItems,
        nearby: !items.length && nearbyItems.length > 0,
        placeName,
        nearestFallback,
      });
    };
    const load = async (coordinates = null, place = null, unmatchedSearch = "") => {
      try {
        const response = await api.get("/villas/public", {
          params: coordinates
            ? { lat: coordinates.latitude, lng: coordinates.longitude }
            : undefined,
        });
        let items = response.data.villas || [];

        if (place) {
          const placeName = normalizePlaceName(place.name);
          const direct = items.filter((villa) => normalizePlaceName([
            villa.name,
            villa.address,
            villa.area,
          ].filter(Boolean).join(" ")).includes(placeName));
          const rankedByDistance = items.map((villa) => {
            const [longitude, latitude] = villa.location?.coordinates || [];
            return {
              ...villa,
              searchDistanceKm: distanceKm(latitude, longitude, place.latitude, place.longitude),
            };
          }).filter((villa) =>
            !direct.some((match) => String(match._id) === String(villa._id)) &&
            Number.isFinite(villa.searchDistanceKm)
          )
            .sort((first, second) => first.searchDistanceKm - second.searchDistanceKm);
          const withinNearbyRadius = rankedByDistance.filter(
            (villa) => villa.searchDistanceKm <= VILLA_NEARBY_RADIUS_KM
          );
          const nearbyItems = withinNearbyRadius.length
            ? withinNearbyRadius
            : rankedByDistance.slice(0, 8);
          show(direct, nearbyItems, place.name, !withinNearbyRadius.length && nearbyItems.length > 0);
          return;
        }

        if (unmatchedSearch) {
          const term = normalizePlaceName(unmatchedSearch);
          show(items.filter((villa) => normalizePlaceName([
            villa.name,
            villa.address,
            villa.area,
            villa.city,
          ].filter(Boolean).join(" ")).includes(term)));
          return;
        }

        show(items);
      } catch (error) {
        if (!active) return;
        toast.error(error.response?.data?.message || "Villas could not be loaded");
        show([]);
      }
    };

    if (search) {
      const place = findIndorePlace(search);
      if (place) {
        load({ latitude: place.latitude, longitude: place.longitude }, place);
      } else {
        load(null, null, search);
      }
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => load(position.coords),
        () => load()
      );
    } else {
      load();
    }

    return () => { active = false; };
  }, [search]);

  const submitSearch = (event) => {
    event.preventDefault();
    const value = searchInput.trim();
    setSearchParams(value ? { search: value } : {});
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchParams({});
  };

  return (
    <main className="container villa-list-page">
      <Helmet>
        <title>{search ? `Villas near ${search} | RoomSlider` : "Book Villas for Stays & Events | RoomSlider"}</title>
        <meta name="description" content="Browse villas for overnight stays and private events, compare real prices, and find stays near your preferred place." />
      </Helmet>
      <header className="villa-page-heading">
        <h1>{search ? `Villas near ${search}` : "Villas for stays & events"}</h1>
        <p><MapPin size={15} /> {nearby ? `No villas listed in ${result.placeName}; showing nearby stays` : search ? "Search available villas by area" : "Browse available villas"}</p>
      </header>

      <form className="villa-search-form" onSubmit={submitSearch}>
        <MapPin size={18} aria-hidden="true" />
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search an area, e.g. Ralamandal"
          aria-label="Search villas by area"
        />
        {searchInput && (
          <button type="button" onClick={clearSearch} aria-label="Clear villa search">
            <X size={17} />
          </button>
        )}
        <button type="submit" className="villa-search-submit" aria-label="Search villas">
          <Search size={18} />
        </button>
      </form>

      {loading ? <p className="villa-list-loading">Loading villas...</p> : villas.length === 0 && nearbyVillas.length === 0 ? (
        <div className="villa-empty">
          {search
            ? `No villas found near ${search}. Try a nearby area.`
            : "Abhi villas available nahi hain."}
        </div>
      ) : (
        <>
          {nearby && (
            <div className="villa-nearby-notice" role="status">
              <strong>{result.placeName} mein abhi villa available nahi hai.</strong>
              <span>
                {result.nearestFallback
                  ? "Closest available villas are shown below with their distance."
                  : `Nearby areas mein ${VILLA_NEARBY_RADIUS_KM} km ke andar available villas dikha rahe hain, closest first.`}
              </span>
            </div>
          )}
          {villas.length > 0 && (
            <div className="villa-grid">
              {villas.map((villa) => (
                <VillaCard key={villa._id} villa={villa} distanceKm={villa.searchDistanceKm} />
              ))}
            </div>
          )}
          {nearbyVillas.length > 0 && (
            <section className="villa-search-nearby">
              <header>
                <h2>More villas nearby</h2>
                {result.placeName && (
                  <p>
                    {result.nearestFallback
                      ? `Closest available stays near ${result.placeName}`
                      : `Available stays within ${VILLA_NEARBY_RADIUS_KM} km of ${result.placeName}`}
                  </p>
                )}
              </header>
              <div className="villa-grid">
                {nearbyVillas.map((villa) => (
                  <VillaCard key={villa._id} villa={villa} distanceKm={villa.searchDistanceKm} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default VillaList;
