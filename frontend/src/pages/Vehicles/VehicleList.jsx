import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Bike, Fuel, Search, UsersRound } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";
import "../../styles/vehicles.css";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "Scooty", label: "Scooty" },
  { value: "Bike", label: "Bike" },
  { value: "Car", label: "Car" },
];
const PRICE_KEYS = { day: "pricePerDay", week: "pricePerWeek", month: "pricePerMonth" };
const PRICE_LABELS = { day: "day", week: "week", month: "month" };
const formatPrice = (price) => `₹${Number(price || 0).toLocaleString("en-IN")}`;
const typeMatches = (vehicle, filter) => filter === "all" || vehicle.type === filter || (filter === "Car" && ["SUV", "Van"].includes(vehicle.type));

function VehicleList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [type, setType] = useState(() => FILTERS.some((filter) => filter.value === searchParams.get("type")) ? searchParams.get("type") : "all");
  const [pricePeriod, setPricePeriod] = useState("day");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "24" });
        if (search.trim()) params.set("search", search.trim());
        if (type !== "all") params.set("type", type);
        const response = await api.get(`/vehicles?${params.toString()}`);
        const result = response.data;
        setVehicles(Array.isArray(result) ? result : result.vehicles || []);
        setPages(Array.isArray(result) ? 1 : result.pages || 1);
        const next = new URLSearchParams();
        if (search.trim()) next.set("search", search.trim());
        if (type !== "all") next.set("type", type);
        setSearchParams(next, { replace: true });
      } catch (error) {
        toast.error(error.response?.data?.message || "Vehicles load nahi ho paaye");
      } finally {
        setLoading(false);
      }
    }, search.trim() ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [search, type, page, setSearchParams]);

  const visibleVehicles = vehicles.filter((vehicle) => typeMatches(vehicle, type));

  return (
    <>
      <Helmet><title>Rent a Vehicle in Indore | RoomSlider</title><meta name="description" content="Browse scooty, bike, car and SUV rentals in Indore. Compare rental periods and submit a direct request." /></Helmet>
      <main className="container vehicle-page">
        <header className="vehicle-heading"><div><h1>Rent a Vehicle</h1><p>Choose a vehicle and tell us how long you need it.</p></div></header>
        <div className="vehicle-controls">
          <div className="vehicle-search"><Search size={18} aria-hidden="true" /><input type="search" placeholder="Search vehicles..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} aria-label="Search vehicles" /></div>
          <div className="vehicle-filter-row" aria-label="Filter by vehicle type">{FILTERS.map((filter) => <button type="button" key={filter.value} className={`vehicle-filter ${type === filter.value ? "active" : ""}`} onClick={() => { setType(filter.value); setPage(1); }}>{filter.label}</button>)}</div>
          <div className="vehicle-price-toggle" aria-label="Display price by period">{Object.keys(PRICE_KEYS).map((period) => <button type="button" key={period} className={pricePeriod === period ? "active" : ""} onClick={() => setPricePeriod(period)}>{period[0].toUpperCase() + period.slice(1)}</button>)}</div>
        </div>

        {loading ? <div className="vehicle-grid">{Array.from({ length: 8 }, (_, index) => <SkeletonRoomCard key={index} />)}</div> : visibleVehicles.length === 0 ? <div className="vehicle-empty"><Bike size={32} /><h2>No vehicles found</h2><p>Try another name or vehicle type.</p></div> : (
          <div className="vehicle-grid">
            {visibleVehicles.map((vehicle) => (
              <Link key={vehicle._id} to={`/vehicles/${vehicle.slug || vehicle.name}`} className="vehicle-card">
                <div className="vehicle-card-media">
                  {vehicle.photos?.[0] ? <img src={vehicle.photos[0]} alt={`${vehicle.brand} ${vehicle.name}`} loading="lazy" /> : <div className="vehicle-photo-placeholder"><Bike size={42} strokeWidth={1.5} /></div>}
                  <span className={`vehicle-availability ${vehicle.isAvailable ? "available" : "unavailable"}`}>{vehicle.isAvailable ? "Available" : "Currently unavailable"}</span>
                </div>
                <div className="vehicle-card-body">
                  <div className="vehicle-card-title"><h2>{vehicle.brand} {vehicle.name}</h2><span>{vehicle.type}</span></div>
                  <p className="vehicle-meta"><Fuel size={15} />{vehicle.fuel} · {vehicle.transmission}</p>
                  <p className="vehicle-meta"><UsersRound size={15} />{vehicle.seats} seats</p>
                  <p className="vehicle-price"><strong>{formatPrice(vehicle[PRICE_KEYS[pricePeriod]])}</strong> / {PRICE_LABELS[pricePeriod]}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && pages > 1 && <nav className="vehicle-pagination" aria-label="Vehicle pages"><button type="button" disabled={page <= 1} onClick={() => { setPage((current) => current - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page >= pages} onClick={() => { setPage((current) => current + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Next</button></nav>}
      </main>
    </>
  );
}

export default VehicleList;
