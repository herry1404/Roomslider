import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { MapPin, Search, UtensilsCrossed } from "lucide-react";
import api from "../../api/axios";
import MessCard from "../../components/ui/MessCard";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";
import { geocodeLocation } from "../../utils/locationAddress";
import "../../styles/mess.css";

function MessList() {
  const [messList, setMessList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState("locating"); // locating | found | denied
  const [search, setSearch] = useState("");

  const fetchMess = async (lat, lng) => {
    setLoading(true);
    try {
      const params = {};
      if (lat != null && lng != null) {
        params.lat = lat;
        params.lng = lng;
      }
      const res = await api.get("/mess/nearby", { params });
      setMessList(res.data || []);
    } catch (error) {
      console.error("Mess Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const loadProfileLocation = async () => {
      try {
        const response = await api.get("/users/me");
        const profile = response.data.user || {};
        const profileArea = profile.preferredArea || profile.area;
        const place = [profileArea, profile.city].filter(Boolean).join(", ");
        if (!place) throw new Error("Profile location is not available");
        const coordinates = await geocodeLocation(place);
        if (!active) return;
        setLocationStatus("profile");
        await fetchMess(coordinates.latitude, coordinates.longitude);
      } catch {
        if (!active) return;
        setLocationStatus("denied");
        await fetchMess();
      }
    };

    const tryProfileLocation = () => {
      if (active) loadProfileLocation();
    };
    if (!navigator.geolocation) {
      tryProfileLocation();
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!active) return;
          setLocationStatus("found");
          fetchMess(position.coords.latitude, position.coords.longitude);
        },
        tryProfileLocation
      );
    }
    return () => {
      active = false;
    };
  }, []);

  const filteredMess = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = locationStatus === "found" || locationStatus === "profile"
      ? [...messList]
      : [...messList].sort((a, b) => a.name.localeCompare(b.name));
    if (!query) return sorted;
    return sorted.filter((mess) => {
      const searchable = [
        mess.name,
        mess.address,
        ...(mess.todayMenu?.items || []).map((item) => item.name),
      ].join(" ").toLowerCase();
      return searchable.includes(query);
    });
  }, [locationStatus, messList, search]);

  return (
    <>
      <Helmet>
        <title>Mess Near You in Indore | RoomSlider</title>
        <meta
          name="description"
          content="Find mess and tiffin services near you in Indore. Daily menu, price per person, and easy ordering with RoomSlider."
        />
        <link rel="canonical" href="https://roomslider.in/mess" />
      </Helmet>

      <main className="mess-page">
        <section className="mess-list-section container">
          <header className="mess-list-heading">
            <div>
              <h1>{search ? "Mess search results" : "Meals near you"}</h1>
              <p className="mess-location-status">
                <MapPin size={15} />
                {locationStatus === "found"
                  ? "Nearest mess services first"
                  : locationStatus === "profile"
                    ? "Nearest to your saved profile area"
                  : locationStatus === "locating"
                    ? "Finding mess near you..."
                    : "Showing mess alphabetically"}
              </p>
            </div>
            <label className="mess-search">
              <Search size={18} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search mess, area, or dish"
              />
            </label>
          </header>

          {!loading && (
            <div className="mess-results-label">
              {filteredMess.length} {filteredMess.length === 1 ? "mess" : "mess services"}
            </div>
          )}

          {loading ? (
            <div className="mess-grid" aria-label="Loading mess listings">
              {Array.from({ length: 8 }).map((_, index) => <SkeletonRoomCard key={index} />)}
            </div>
          ) : filteredMess.length ? (
            <div className="mess-grid">
              {filteredMess.map((mess) => <MessCard key={mess._id} mess={mess} />)}
            </div>
          ) : (
            <div className="mess-empty-state">
              <span><UtensilsCrossed size={26} /></span>
              <h3>{search ? "No matching mess found" : "No mess listings yet"}</h3>
              <p>{search ? "Try another mess name, area, or menu item." : "Please check back soon for nearby meal options."}</p>
              {search && <button type="button" onClick={() => setSearch("")}>Clear search</button>}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default MessList;
