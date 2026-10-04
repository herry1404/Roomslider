import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { BadgeCheck, BookOpen, FileText, MapPin, MessageCircle, Phone, Wrench, X } from "lucide-react";
import api from "../../api/axios";
import indoreAreas from "../../data/indoreAreas";
import { reverseGeocodeLocation } from "../../utils/locationAddress";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";
import "../../styles/services.css";

const CATEGORY_META = {
  cleaning: { title: "Cleaning & Housekeeping", sub: "Workers for cleaning, cooking and home care" },
  packers: { title: "Packers & Movers", sub: "Workers for shifting and moving help" },
  furniture: { title: "Furniture & Appliance Rental", sub: "Furniture and appliance help" },
  wifi: { title: "WiFi & RO Water", sub: "WiFi and RO service workers" },
  "appliance-repair": { title: "Appliance Repair", sub: "Repair workers near you" },
  "study-support": { title: "Study Support", sub: "Libraries, tutors and printing help" },
  "rent-agreement": { title: "Rent Agreement", sub: "Agreement drafting and tenant verification help" },
};
const WA_NUMBER = "919131181848";
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const readUser = () => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } };
const rateUnit = (item = {}) => item.unit || (item.perUnit ? `per ${item.perUnit}` : "");
const rateText = (item) => `${money(item.price)}${rateUnit(item) ? ` / ${rateUnit(item).replace(/^per\s+/i, "")}` : ""}`;
const legacyText = (provider) => provider.priceNote || (provider.price === 0 ? "₹0" : provider.price ? (typeof provider.price === "number" ? money(provider.price) : String(provider.price)) : "");
const quantityLabel = (perUnit) => ({ washroom: "washrooms", person: "persons", machine: "machines", room: "rooms" }[perUnit] || "quantity");

function WorkerIcon({ category }) {
  if (category === "study-support") return <BookOpen size={26} />;
  if (category === "rent-agreement") return <FileText size={26} />;
  return <Wrench size={26} />;
}

function ServiceList() {
  const { category } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratesProvider, setRatesProvider] = useState(null);
  const [requestProvider, setRequestProvider] = useState(null);
  const [selected, setSelected] = useState({});
  const [address, setAddress] = useState({ flatNo: "", building: "", area: "", landmark: "", lat: "", lng: "" });
  const [startDate, setStartDate] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("morning");
  const [note, setNote] = useState("");
  const [extra, setExtra] = useState({ ownerName: "", tenantName: "", monthlyRent: "", deposit: "", startDate: "" });
  const [idPhoto, setIdPhoto] = useState(null);
  const [locationBusy, setLocationBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  const user = readUser();
  const meta = CATEGORY_META[category] || { title: "Services", sub: "" };
  const isRent = requestProvider?.category === "rent-agreement";

  useEffect(() => {
    setLoading(true);
    api.get(`/services/${category}`)
      .then((res) => setProviders(Array.isArray(res.data) ? res.data : []))
      .catch((error) => console.error("Service fetch error:", error))
      .finally(() => setLoading(false));
  }, [category]);

  const chosenItems = useMemo(() => Object.entries(selected).map(([index, quantity]) => ({
    ...requestProvider?.priceList?.[Number(index)],
    quantity,
  })).filter((item) => item?.name), [selected, requestProvider]);
  const total = useMemo(() => chosenItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0), [chosenItems]);
  const hasMonthly = chosenItems.some((item) => item.type === "monthly");
  const hasOneTime = chosenItems.some((item) => item.type === "one-time") || (!chosenItems.length && Boolean(requestProvider));

  const openRequest = (provider) => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    setRatesProvider(null);
    setRequestProvider(provider);
    setSelected({});
    setDone(null);
  };
  const closeRequest = () => { setRequestProvider(null); setDone(null); };
  const toggleItem = (index) => setSelected((current) => {
    if (current[index]) { const next = { ...current }; delete next[index]; return next; }
    return { ...current, [index]: 1 };
  });
  const setQuantity = (index, quantity) => setSelected((current) => ({ ...current, [index]: Math.min(99, Math.max(1, quantity)) }));
  const setAddrField = (key, value) => setAddress((current) => ({ ...current, [key]: value }));
  const locate = () => {
    if (!navigator.geolocation) return toast.error("Location is not supported on this device");
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const place = await reverseGeocodeLocation(coords.latitude, coords.longitude);
        setAddress((current) => ({ ...current, lat: String(coords.latitude), lng: String(coords.longitude), flatNo: current.flatNo || place.houseNumber || "", area: place.area || current.area, landmark: current.landmark || place.nearby || "" }));
        toast.success("Current location added");
      } catch {
        setAddress((current) => ({ ...current, lat: String(coords.latitude), lng: String(coords.longitude) }));
        toast.error("Location found. Please complete the address.");
      } finally { setLocationBusy(false); }
    }, () => { setLocationBusy(false); toast.error("Location permission was denied"); }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!address.flatNo.trim() || !address.area) return toast.error("Enter your flat or house number and area");
    if (requestProvider.priceList?.length && !chosenItems.length) return toast.error("Choose at least one service");
    if (hasMonthly && !startDate) return toast.error("Choose a start date");
    if (hasOneTime && !preferredDate) return toast.error("Choose a preferred date");
    setSending(true);
    try {
      const data = new FormData();
      data.append("providerId", requestProvider._id);
      data.append("selectedItems", JSON.stringify(chosenItems.map((item) => ({ name: item.name, type: item.type, quantity: item.quantity }))));
      data.append("address", JSON.stringify(address));
      data.append("startDate", startDate);
      data.append("preferredDate", preferredDate);
      data.append("preferredTimeSlot", preferredTimeSlot);
      data.append("note", note);
      data.append("extra", JSON.stringify(extra));
      if (idPhoto) data.append("idPhoto", idPhoto);
      const { data: response } = await api.post("/service-bookings", data);
      const requestId = response.requestId || response.id;
      const addressText = [address.flatNo, address.building, address.area, address.landmark].filter(Boolean).join(", ");
      const maps = address.lat && address.lng ? `https://www.google.com/maps?q=${address.lat},${address.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText + ", Indore")}`;
      const lines = chosenItems.map((item) => `${item.quantity} ${quantityLabel(item.perUnit)} · ${item.name}: ${money(Number(item.price) * item.quantity)} (${rateUnit(item) || "rate on request"})`);
      const message = [
        `Hi RoomSlider, I submitted service request ${requestId}.`, requestProvider.name, ...lines,
        `Estimated total: ${chosenItems.length ? money(total) : "Price on request"}`,
        ...(isRent ? [`Owner: ${extra.ownerName}`, `Tenant: ${extra.tenantName}`, `Monthly rent: ${extra.monthlyRent}`, `Deposit: ${extra.deposit}`, `Agreement start: ${extra.startDate}`] : []),
        `Address: ${addressText}`, ...(hasMonthly ? [`Service start: ${startDate}`] : []), ...(hasOneTime ? [`Preferred: ${preferredDate} · ${preferredTimeSlot}`] : []), `Map: ${maps}`,
      ].filter(Boolean).join("\n");
      setDone({ id: requestId, url: `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}` });
    } catch (error) {
      console.error("Service request error:", error);
      toast.error(error.response?.data?.message || "Could not submit request");
    } finally { setSending(false); }
  };

  if (loading) return <div className="container service-page"><div className="skeleton-grid">{Array.from({ length: 6 }).map((_, index) => <SkeletonRoomCard key={index} />)}</div></div>;

  return <>
    <Helmet><title>{meta.title} | RoomSlider</title><meta name="description" content={meta.sub} /></Helmet>
    <section className="container service-page">
      <h1>{meta.title}</h1><p className="service-sub">{meta.sub}</p>
      {!providers.length ? <h3>No workers found yet</h3> : <div className="service-grid">{providers.map((provider) => {
        const prices = (provider.priceList || []).map((item) => Number(item.price)).filter((price) => Number.isFinite(price));
        const services = (provider.priceList || []).map((item) => item.name);
        const legacy = legacyText(provider);
        return <article key={provider._id} className="service-card" tabIndex="0" role="button" onClick={() => setRatesProvider(provider)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setRatesProvider(provider); }}>
          {provider.images?.[0] ? <img className="service-worker-photo" src={optimizeCloudinaryImage(provider.images[0], 640)} alt="" loading="lazy" /> : <div className="service-worker-photo service-worker-icon"><WorkerIcon category={category} /></div>}
          <div className="service-worker-title"><h3>{provider.name}</h3>{provider.isVerified && <span className="service-verified"><BadgeCheck size={16} /> Verified</span>}</div>
          <div className="service-meta"><MapPin size={14} /> {provider.area}{provider.city ? `, ${provider.city}` : ""}</div>
          {Number(provider.experienceYears) > 0 && <p className="service-worker-line">{provider.experienceYears} yrs experience</p>}
          {provider.availability && <p className="service-worker-line">Available: {provider.availability}</p>}
          {services.length > 0 && <div className="service-chips">{services.slice(0, 3).map((service) => <span key={service}>{service}</span>)}{services.length > 3 && <span>+{services.length - 3} more</span>}</div>}
          {prices.length > 0 ? <strong className="service-starts">Starts from Rs {Math.min(...prices).toLocaleString("en-IN")}</strong> : legacy && <span className="service-price">{legacy}</span>}
          <button type="button" className="service-rates-link" onClick={(event) => { event.stopPropagation(); setRatesProvider(provider); }}>{services.length ? "View all rates" : "View details"}</button>
          <div className="service-actions" onClick={(event) => event.stopPropagation()}><button className="service-btn request" onClick={() => openRequest(provider)}>Request Service</button><a className="service-btn call" href={`tel:${provider.contactNumber}`}><Phone size={16} /> Call</a><a className="service-btn wa" href={`https://wa.me/${String(provider.contactNumber).replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a></div>
        </article>;
      })}</div>}
    </section>

    {ratesProvider && <div className="service-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setRatesProvider(null); }}><section className="service-detail-sheet" role="dialog" aria-modal="true" aria-label={`${ratesProvider.name} rates`}>
      <header className="service-sheet-header"><div><h2>{ratesProvider.name}</h2><p>{ratesProvider.description || ratesProvider.availability || "Worker rates"}</p></div><button className="service-modal-close" type="button" onClick={() => setRatesProvider(null)} aria-label="Close"><X /></button></header>
      <div className="service-sheet-body">{ratesProvider.priceList?.length ? ["monthly", "one-time"].map((type) => {
        const rates = ratesProvider.priceList.filter((item) => item.type === type);
        return rates.length ? <section className="service-rate-group" key={type}><h3>{type === "monthly" ? "Monthly" : "One-time"}</h3>{rates.map((item, index) => <div className="service-rate-row" key={`${item.name}-${index}`}><span>{item.name}{item.note ? <small>{item.note}</small> : null}</span><strong>{rateText(item)}</strong></div>)}</section> : null;
      }) : <p className="service-legacy-rate">{legacyText(ratesProvider) || "Contact this worker for rates."}</p>}</div>
      <footer className="service-sheet-footer"><button className="service-submit" onClick={() => openRequest(ratesProvider)}>Request Service</button></footer>
    </section></div>}

    {requestProvider && <div className="service-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeRequest(); }}><form className="service-request-sheet" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Request Service">
      <header className="service-sheet-header"><div><h2>Request {requestProvider.name}</h2><p>Requesting as {user?.name || "your account"} - {user?.phone || "Phone not on profile"}</p></div><button className="service-modal-close" type="button" onClick={closeRequest} aria-label="Close"><X /></button></header>
      {!done ? <div className="service-sheet-body">
        {requestProvider.priceList?.length > 0 && <section className="service-form-section"><h3>Choose services</h3>{requestProvider.priceList.map((item, index) => {
          const quantity = selected[index] || 1;
          const active = Boolean(selected[index]);
          return <div className={`service-request-row ${active ? "selected" : ""}`} key={`${item.name}-${index}`} onClick={() => toggleItem(index)}>
            <input type="checkbox" checked={active} onChange={() => toggleItem(index)} onClick={(event) => event.stopPropagation()} aria-label={`Select ${item.name}`} />
            <span className="service-request-name">{item.name}{item.allowQuantity && active && <small>{quantityLabel(item.perUnit)}</small>}</span>
            <strong>{rateText(item)}</strong>
            {item.allowQuantity && active && <div className="service-stepper" onClick={(event) => event.stopPropagation()}><button type="button" aria-label="Reduce quantity" onClick={() => setQuantity(index, quantity - 1)}>−</button><span>{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity(index, quantity + 1)}>+</button></div>}
          </div>;
        })}</section>}
        {isRent && <section className="service-form-section"><h3>Agreement details</h3><p className="service-legal">RoomSlider is a facilitator. Agreement is prepared by our partner advocate. Stamp duty extra as per MP rules.</p><div className="service-form-grid"><input placeholder="Owner name" value={extra.ownerName} required onChange={(event) => setExtra({ ...extra, ownerName: event.target.value })} /><input placeholder="Tenant name" value={extra.tenantName} required onChange={(event) => setExtra({ ...extra, tenantName: event.target.value })} /><input type="number" min="0" placeholder="Monthly rent (₹)" value={extra.monthlyRent} required onChange={(event) => setExtra({ ...extra, monthlyRent: event.target.value })} /><input type="number" min="0" placeholder="Deposit (₹)" value={extra.deposit} required onChange={(event) => setExtra({ ...extra, deposit: event.target.value })} /><label>Agreement start date<input type="date" value={extra.startDate} required onChange={(event) => setExtra({ ...extra, startDate: event.target.value })} /></label><label>ID photo (optional, admin only)<input type="file" accept="image/*" onChange={(event) => setIdPhoto(event.target.files?.[0] || null)} /></label></div></section>}
        {(hasMonthly || hasOneTime) && <section className="service-form-section"><h3>When do you need it?</h3><div className="service-form-grid">{hasMonthly && <label>Start date<input type="date" min={new Date().toISOString().slice(0, 10)} required value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>}{hasOneTime && <><label>Preferred date<input type="date" min={new Date().toISOString().slice(0, 10)} required value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} /></label><div className="service-time-chips">{["morning", "afternoon", "evening"].map((slot) => <button type="button" key={slot} className={preferredTimeSlot === slot ? "active" : ""} onClick={() => setPreferredTimeSlot(slot)}>{slot}</button>)}</div></>}</div></section>}
        <section className="service-form-section"><h3>Service address</h3><div className="service-form-grid"><input placeholder="Flat / house no." required value={address.flatNo} onChange={(event) => setAddrField("flatNo", event.target.value)} /><input placeholder="Building / PG" value={address.building} onChange={(event) => setAddrField("building", event.target.value)} /><select required value={address.area} onChange={(event) => setAddrField("area", event.target.value)}><option value="">Select Indore area</option>{indoreAreas.map((area) => <option value={area.name} key={area.name}>{area.name}</option>)}<option value="Other">Other</option></select><input placeholder="Landmark" value={address.landmark} onChange={(event) => setAddrField("landmark", event.target.value)} /></div><button type="button" className="service-location-btn" onClick={locate} disabled={locationBusy}>{locationBusy ? "Finding location…" : "Use my current location"}</button></section>
        <label className="service-note-label">Note (optional)<textarea rows="2" value={note} onChange={(event) => setNote(event.target.value)} /></label>
      </div> : <div className="service-sheet-body service-success"><h2>Request saved</h2><p>Request ID: <strong>{done.id}</strong></p><p>We will call you shortly.</p><a className="service-btn wa" href={done.url} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Send on WhatsApp</a></div>}
      <footer className="service-sheet-footer">{done ? <button type="button" className="service-submit" onClick={closeRequest}>Done</button> : <><strong>Estimated total: {chosenItems.length ? money(total) : "Price on request"}</strong><button className="service-submit" disabled={sending}>{sending ? "Submitting…" : "Submit Request"}</button></>}</footer>
    </form></div>}
  </>;
}

export default ServiceList;
