import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Bike, CalendarDays, Fuel, MapPin, ShieldCheck, UsersRound } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { lookupPostalCode, reverseGeocodeLocation } from "../../utils/locationAddress";
import "../../styles/vehicles.css";

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString("en-IN")}`;
const toLocalDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDays = (date, amount) => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};
const durationFromDays = (days, type) => {
  if (type === "week") return Math.ceil(days / 7);
  if (type === "month") return Math.ceil(days / 30);
  return days;
};

function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tomorrow = useMemo(() => addDays(new Date(), 1), []);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [location, setLocation] = useState(null);
  const [locationBusy, setLocationBusy] = useState(false);
  const [postalLookup, setPostalLookup] = useState("");
  const [postalAreas, setPostalAreas] = useState([]);
  const [form, setForm] = useState({
    pickupDate: toLocalDate(tomorrow),
    returnDate: toLocalDate(addDays(tomorrow, 1)),
    durationType: "day",
    pickupOption: "self pickup",
    house: "",
    building: "",
    area: "",
    landmark: "",
    city: "Indore",
    state: "Madhya Pradesh",
    postalCode: "",
  });

  useEffect(() => {
    let active = true;
    api.get(`/vehicles/${id}`)
      .then(({ data }) => {
        if (!active) return;
        setVehicle(data);
        setPhotoIndex(0);
      })
      .catch((error) => { if (active) toast.error(error.response?.data?.message || "Vehicle nahi mila"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!/^\d{6}$/.test(form.postalCode)) return undefined;
    let active = true;
    const timeoutId = setTimeout(async () => {
      setPostalLookup("loading");
      try {
        const postalAddress = await lookupPostalCode(form.postalCode);
        if (!active) return;
        setPostalAreas(postalAddress.areas);
        setForm((current) => ({
          ...current,
          area: postalAddress.areas[0] || current.area,
          city: postalAddress.city || current.city,
          state: postalAddress.state || current.state,
        }));
        setPostalLookup("success");
      } catch (error) {
        if (!active) return;
        setPostalAreas([]);
        setPostalLookup(error.message === "PIN code not found." ? "not-found" : "error");
      }
    }, 400);
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [form.postalCode]);

  const days = Math.max(0, Math.ceil((new Date(`${form.returnDate}T00:00:00`) - new Date(`${form.pickupDate}T00:00:00`)) / 86400000));
  const periods = durationFromDays(days, form.durationType);
  const pricePerPeriod = vehicle ? vehicle[`pricePer${form.durationType[0].toUpperCase()}${form.durationType.slice(1)}`] : 0;
  const total = Number(pricePerPeriod || 0) * periods;
  const photos = vehicle?.photos || [];

  const updateForm = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "durationType" || key === "pickupDate") {
        const start = key === "pickupDate" ? new Date(`${value}T00:00:00`) : new Date(`${current.pickupDate}T00:00:00`);
        const period = key === "durationType" ? value : current.durationType;
        const periodDays = period === "week" ? 7 : period === "month" ? 30 : 1;
        next.returnDate = toLocalDate(addDays(start, periodDays));
      }
      return next;
    });
  };

  const updatePostalCode = (event) => {
    const postalCode = event.target.value.replace(/\D/g, "").slice(0, 6);
    setForm((current) => ({ ...current, postalCode }));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported on this device");
      return;
    }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLocation({ lat: latitude, lng: longitude });
        try {
          const address = await reverseGeocodeLocation(latitude, longitude);
          setForm((current) => ({
            ...current,
            house: address.houseNumber || current.house,
            building: current.building,
            area: address.area || current.area,
            landmark: address.nearby || current.landmark,
            city: address.city || current.city,
            state: address.state || current.state,
            postalCode: address.postalCode || current.postalCode,
          }));
          toast.success("Current location and address added.");
        } catch {
          toast.error("Location found, but address lookup failed. Enter the address manually.");
        } finally {
          setLocationBusy(false);
        }
      },
      () => {
        setLocationBusy(false);
        toast.error("Location permission is unavailable. Enter the address manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const requestRental = async (event) => {
    event.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: `/vehicles/${id}` } });
      return;
    }
    if (!user.phone || String(user.phone).replace(/\D/g, "").slice(-10).length !== 10) {
      toast.error("Rental request se pehle profile mein valid phone number add karein");
      navigate("/profile/edit");
      return;
    }
    if (!form.house.trim() || !form.area.trim() || !form.city.trim() || !form.state.trim() || !/^\d{6}$/.test(form.postalCode)) {
      toast.error("Enter house number, area, city, state, and a valid 6-digit PIN code.");
      return;
    }
    if (!days || !total) {
      toast.error("Valid pickup aur return dates choose karein");
      return;
    }
    const popup = window.open("about:blank", "_blank");
    try {
      setSending(true);
      const response = await api.post("/vehicle-requests", {
        vehicleId: vehicle._id,
        pickupDate: new Date(`${form.pickupDate}T00:00:00`).toISOString(),
        returnDate: new Date(`${form.returnDate}T00:00:00`).toISOString(),
        durationType: form.durationType,
        pickupOption: form.pickupOption,
        address: {
          house: form.house,
          building: form.building,
          area: form.area,
          landmark: form.landmark,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
        },
        location,
      });
      const rental = response.data;
      const address = [
        form.house,
        form.building,
        form.area,
        form.landmark ? `Near ${form.landmark}` : "",
        form.city,
        form.state,
        form.postalCode,
      ].filter(Boolean).join(", ");
      const mapsLink = location
        ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Indore`)}`;
      const message = [
        `Hi RoomSlider, I submitted a vehicle rental request.`,
        `Request ID: ${rental._id}`,
        `Vehicle: ${vehicle.brand} ${vehicle.name}`,
        `Pickup: ${form.pickupDate}`,
        `Return: ${form.returnDate}`,
        `Duration: ${days} day(s) · ${form.durationType} pricing`,
        `Pickup option: ${form.pickupOption}`,
        `Total rental price: ${formatPrice(rental.totalPrice)}`,
        `Security deposit: ${formatPrice(vehicle.securityDeposit)}`,
        `Name: ${user.name || rental.name}`,
        `Phone: ${user.phone || rental.phone}`,
        `Address: ${address}`,
        ...(mapsLink ? [`Google Maps: ${mapsLink}`] : []),
      ].join("\n");
      const whatsappUrl = `https://wa.me/919131181848?text=${encodeURIComponent(message)}`;
      if (popup) popup.location.href = whatsappUrl;
      else window.location.assign(whatsappUrl);
      toast.success(`Request saved. ID: ${rental._id}`);
    } catch (error) {
      popup?.close();
      toast.error(error.response?.data?.message || "Rental request save nahi hui");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <main className="container vehicle-page"><div className="vehicle-detail-skeleton" /></main>;
  if (!vehicle) return <main className="container vehicle-page"><div className="vehicle-empty"><h1>Vehicle not found</h1><Link to="/vehicles">Browse vehicles</Link></div></main>;
  if (vehicle.slug && id !== vehicle.slug) return <Navigate to={`/vehicles/${vehicle.slug}`} replace />;

  return (
    <>
      <Helmet><title>{vehicle.brand} {vehicle.name} Rental | RoomSlider</title></Helmet>
      <main className="container vehicle-page vehicle-detail-page">
        <Link className="vehicle-back" to="/vehicles"><ArrowLeft size={18} /> All vehicles</Link>
        <header className="vehicle-detail-heading"><div><h1>{vehicle.brand} {vehicle.name}</h1><p>{vehicle.type} · {vehicle.fuel} · {vehicle.transmission}</p></div><span className={`vehicle-availability ${vehicle.isAvailable ? "available" : "unavailable"}`}>{vehicle.isAvailable ? "Available" : "Currently unavailable"}</span></header>
        <div className="vehicle-detail-layout">
          <article className="vehicle-detail-info">
            <div className="vehicle-gallery">
              {photos.length ? <img className="vehicle-gallery-main" src={optimizeCloudinaryImage(photos[photoIndex], 1600)} alt={`${vehicle.brand} ${vehicle.name}`} loading="eager" /> : <div className="vehicle-gallery-main vehicle-photo-placeholder"><Bike size={54} strokeWidth={1.5} /></div>}
              {photos.length > 1 && <div className="vehicle-gallery-thumbnails">{photos.map((photo, index) => <button type="button" key={`${photo}-${index}`} className={photoIndex === index ? "active" : ""} onClick={() => setPhotoIndex(index)} aria-label={`Show vehicle photo ${index + 1}`}><img src={optimizeCloudinaryImage(photo, 640)} alt="" loading="lazy" /></button>)}</div>}
            </div>
            <section className="vehicle-detail-section"><h2>Vehicle specifications</h2><div className="vehicle-spec-grid">
              <p><Bike size={17} /><span>Type</span><strong>{vehicle.type}</strong></p>
              <p><Fuel size={17} /><span>Fuel & transmission</span><strong>{vehicle.fuel} · {vehicle.transmission}</strong></p>
              <p><UsersRound size={17} /><span>Seats</span><strong>{vehicle.seats}</strong></p>
              <p><MapPin size={17} /><span>Included distance</span><strong>{vehicle.freeKmPerDay} km/day</strong></p>
              <p className="vehicle-spec-extra-distance"><span>Extra distance</span><strong>{formatPrice(vehicle.extraKmCharge)} <span>/ km</span></strong></p>
              <p><ShieldCheck size={17} /><span>Security deposit</span><strong>{formatPrice(vehicle.securityDeposit)}</strong></p>
              <p className="vehicle-spec-no-icon"><span>Helmet</span><strong>{vehicle.helmetIncluded ? "Included" : "Not included"}</strong></p>
            </div></section>
            {vehicle.fuelPolicy && <section className="vehicle-detail-section"><h2>Fuel policy</h2><p>{vehicle.fuelPolicy}</p></section>}
            {vehicle.documentsRequired && <section className="vehicle-detail-section"><h2>Documents required</h2><p>{vehicle.documentsRequired}</p></section>}
            <section className="vehicle-detail-section"><h2>Rental prices</h2><div className="vehicle-price-list"><p><span>Per day</span><strong>{formatPrice(vehicle.pricePerDay)}</strong></p><p><span>Per week</span><strong>{formatPrice(vehicle.pricePerWeek)}</strong></p><p><span>Per month</span><strong>{formatPrice(vehicle.pricePerMonth)}</strong></p>{vehicle.pricePerHour != null && <p><span>Per hour</span><strong>{formatPrice(vehicle.pricePerHour)}</strong></p>}</div></section>
          </article>

          <aside className="vehicle-request-card">
            <h2>Request Rental</h2>
            <p className="vehicle-request-price"><strong>{formatPrice(vehicle.pricePerDay)}</strong> / day</p>
            <p className="vehicle-request-hint">No payment now. Submit a rental request and continue on WhatsApp.</p>
            <form onSubmit={requestRental}>
              {user ? <p className="vehicle-account-info">Requesting as <strong>{user.name}</strong><br /><span>{user.phone || "Phone number missing from profile"}</span></p> : <button type="button" className="vehicle-login-note" onClick={() => navigate("/login", { state: { from: `/vehicles/${id}` } })}>Login to request this vehicle</button>}
              <label>Pickup date<input type="date" min={toLocalDate(new Date())} required value={form.pickupDate} onChange={updateForm("pickupDate")} /></label>
              <label>Return date<input type="date" min={form.pickupDate} required value={form.returnDate} onChange={updateForm("returnDate")} /></label>
              <label>Price period<select value={form.durationType} onChange={updateForm("durationType")}><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select></label>
              <fieldset className="vehicle-pickup-options">
                <legend>Pickup option</legend>
                <label><input type="radio" name="pickupOption" value="self pickup" checked={form.pickupOption === "self pickup"} onChange={updateForm("pickupOption")} /><span>Self pickup</span></label>
                <label><input type="radio" name="pickupOption" value="delivery" checked={form.pickupOption === "delivery"} onChange={updateForm("pickupOption")} /><span>Delivery</span></label>
              </fieldset>
              <div className="vehicle-address-title"><CalendarDays size={17} /> Pickup / delivery address</div>
              <label>Flat / house no.<input required value={form.house} onChange={updateForm("house")} placeholder="House or flat number" /></label>
              <label>Building / PG<input value={form.building} onChange={updateForm("building")} placeholder="Building or PG name" /></label>
              <label>Area / locality<input required list="vehicle-postal-areas" value={form.area} onChange={updateForm("area")} placeholder="Area or locality" /></label>
              <datalist id="vehicle-postal-areas">{postalAreas.map((area) => <option key={area} value={area} />)}</datalist>
              <label>Nearby landmark<input value={form.landmark} onChange={updateForm("landmark")} placeholder="Nearby landmark (optional)" /></label>
              <label>City<input required value={form.city} onChange={updateForm("city")} placeholder="City" /></label>
              <label>State<input required value={form.state} onChange={updateForm("state")} placeholder="State" /></label>
              <label>PIN code<input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} required value={form.postalCode} onChange={updatePostalCode} placeholder="6-digit PIN code" /></label>
              <span className="vehicle-postal-status" aria-live="polite">
                {postalLookup === "loading" && "Looking up area, city, and state..."}
                {postalLookup === "success" && "Area, city, and state filled from PIN code."}
                {postalLookup === "not-found" && "PIN code not found. Enter address details manually."}
                {postalLookup === "error" && "Could not look up PIN code. Enter address details manually."}
              </span>
              <button className="vehicle-location-btn" type="button" onClick={useCurrentLocation} disabled={locationBusy}><MapPin size={16} />{locationBusy ? "Getting location..." : location ? "Current location added" : "Use my current location"}</button>
              <div className="vehicle-total"><span>{days ? `${periods} ${form.durationType}${periods === 1 ? "" : "s"} · ${days} day(s)` : "Choose rental dates"}</span><strong>{formatPrice(total)}</strong></div>
              <p className="vehicle-deposit-note">Security deposit: {formatPrice(vehicle.securityDeposit)} (payable separately, if applicable).</p>
              <button className="vehicle-request-button" type="submit" disabled={sending || !vehicle.isAvailable}>{sending ? "Saving request..." : vehicle.isAvailable ? "Request Rental" : "Currently unavailable"}</button>
              {!user && <p className="vehicle-login-caption">Please login first. Your account name and phone will be filled automatically.</p>}
            </form>
          </aside>
        </div>
      </main>
    </>
  );
}

export default VehicleDetail;
