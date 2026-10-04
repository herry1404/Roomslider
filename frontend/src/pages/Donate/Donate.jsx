import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MapPin, Package, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import indoreAreas from "../../data/indoreAreas";
import "../../styles/donate.css";

const ITEM_TYPES = [
  ["books", "Books"], ["clothes", "Clothes"], ["furniture", "Furniture"], ["utensils", "Utensils"],
  ["electronics", "Electronics"], ["bedding", "Bedding"], ["other", "Other"],
];
const CONDITIONS = [["good", "Good"], ["usable", "Usable"], ["needs_repair", "Needs repair"]];
const TIMES = [["morning", "Morning"], ["afternoon", "Afternoon"], ["evening", "Evening"]];
const EXCLUSIONS = ["Broken or unsafe electronics", "Used mattresses or pillows in poor condition", "Medicines", "Perishable food"];
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const label = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function Donate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(Boolean(localStorage.getItem("token")));
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    itemType: "books", description: "", quantity: "1", condition: "good",
    address: { flat: "", building: "", area: "", landmark: "", lat: "", lng: "" },
    preferredDate: "", preferredTimeSlot: "morning",
  });
  const photoNames = useMemo(() => files.map((file) => file.name), [files]);

  const loadRequests = async () => {
    if (!localStorage.getItem("token")) {
      setLoadingRequests(false);
      return;
    }
    try {
      const { data } = await api.get("/donations/mine");
      setRequests(data.requests || []);
    } catch {
      toast.error("Your donation requests could not be loaded");
    } finally {
      setLoadingRequests(false);
    }
  };
  useEffect(() => { loadRequests(); }, []);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const updateAddress = (key) => (event) => setForm((current) => ({ ...current, address: { ...current.address, [key]: event.target.value } }));

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error("Location is not supported on this device");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const nearest = indoreAreas.map((area) => {
        const distance = Math.hypot(area.latitude - coords.latitude, area.longitude - coords.longitude);
        return { name: area.name, distance };
      }).sort((a, b) => a.distance - b.distance)[0];
      setForm((current) => ({
        ...current,
        address: {
          ...current.address,
          lat: String(coords.latitude),
          lng: String(coords.longitude),
          area: current.address.area || nearest?.name || "",
        },
      }));
      setLocating(false);
      toast.success("Location added. Please confirm your pickup address.");
    }, () => {
      setLocating(false);
      toast.error("Location permission was denied");
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const choosePhotos = (event) => {
    const chosen = Array.from(event.target.files || []);
    if (chosen.length > 4) {
      toast.error("Choose up to 4 photos");
      event.target.value = "";
      return;
    }
    if (chosen.some((file) => file.size > 5 * 1024 * 1024)) {
      toast.error("Each photo must be 5 MB or smaller");
      event.target.value = "";
      return;
    }
    setFiles(chosen);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!localStorage.getItem("token")) {
      navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    if (!form.address.flat.trim() || !form.address.area) return toast.error("Enter your flat or house number and area");
    if (!form.preferredDate) return toast.error("Choose a preferred pickup date");
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("itemType", form.itemType);
      payload.append("description", form.description.trim());
      payload.append("quantity", form.quantity);
      payload.append("condition", form.condition);
      payload.append("address", JSON.stringify(form.address));
      payload.append("preferredDate", form.preferredDate);
      payload.append("preferredTimeSlot", form.preferredTimeSlot);
      files.forEach((file) => payload.append("photos", file));
      await api.post("/donations", payload);
      toast.success("Pickup request submitted");
      setForm((current) => ({ ...current, description: "", quantity: "1", preferredDate: "" }));
      setFiles([]);
      await loadRequests();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Donation request could not be submitted");
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (requestId) => {
    try {
      await api.put(`/donations/${requestId}/cancel`);
      toast.success("Donation request cancelled");
      await loadRequests();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Request could not be cancelled");
    }
  };

  return <>
    <Helmet>
      <title>Donate Old Things in Indore | RoomSlider</title>
      <meta name="description" content="Arrange a pickup for usable household items in Indore. RoomSlider collects items and rents them at a low price to students in need." />
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <main className="donate-page">
    <header className="donate-header"><span className="donate-kicker">Give useful items a second life</span><h1>Donate old things</h1><p>RoomSlider collects your items and rents them at a low price to students in need.</p></header>
    <div className="donate-layout">
      <form className="donate-form" onSubmit={submit}>
        <h2>Arrange a pickup</h2>
        <div className="donate-grid">
          <label>Item type<select value={form.itemType} onChange={update("itemType")}>{ITEM_TYPES.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>
          <label>Quantity<input type="number" min="1" max="100" required value={form.quantity} onChange={update("quantity")} /></label>
        </div>
        <label>Description<textarea rows="3" required maxLength={1500} placeholder="Describe the item and include its size or model when useful." value={form.description} onChange={update("description")} /></label>
        <fieldset className="donate-condition"><legend>Condition</legend>{CONDITIONS.map(([value, title]) => <label key={value}><input type="radio" name="condition" value={value} checked={form.condition === value} onChange={update("condition")} />{title}</label>)}</fieldset>
        <label className="donate-upload"><UploadCloud size={19} /><span><strong>Photos (optional)</strong><small>Choose up to 4 photos, 5 MB each.</small></span><input type="file" accept="image/*" multiple onChange={choosePhotos} /></label>
        {photoNames.length > 0 && <p className="donate-photo-list">{photoNames.join(" · ")}</p>}
        <section className="donate-address"><div className="donate-section-heading"><div><h3>Pickup address</h3><p>Your address and contact details are shared only with RoomSlider staff.</p></div><button type="button" className="donate-location" onClick={handleCurrentLocation} disabled={locating}><MapPin size={15} />{locating ? "Finding…" : "Use my current location"}</button></div>
          <div className="donate-grid"><label>Flat / house number<input required maxLength="100" value={form.address.flat} onChange={updateAddress("flat")} /></label><label>Building / PG<input maxLength="150" value={form.address.building} onChange={updateAddress("building")} /></label>
            <label>Area<select required value={form.address.area} onChange={updateAddress("area")}><option value="">Select Indore area</option>{indoreAreas.map((area) => <option key={area.name} value={area.name}>{area.name}</option>)}<option value="Other">Other</option></select></label><label>Landmark<input maxLength="200" value={form.address.landmark} onChange={updateAddress("landmark")} /></label></div>
        </section>
        <div className="donate-grid"><label>Preferred pickup date<input type="date" min={today()} required value={form.preferredDate} onChange={update("preferredDate")} /></label><label>Preferred time slot<select value={form.preferredTimeSlot} onChange={update("preferredTimeSlot")}>{TIMES.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label></div>
        <button className="donate-submit" disabled={saving}>{saving ? "Submitting…" : "Request a pickup"}</button>
      </form>
      <aside className="donate-aside"><h2>Items we cannot accept</h2><ul>{EXCLUSIONS.map((item) => <li key={item}>{item}</li>)}</ul><p>RoomSlider reviews every request and confirms pickup details with you. Submitted items are not guaranteed to be collected.</p></aside>
    </div>
    <section className="donate-requests"><div><h2>Your pickup requests</h2><p>Track status without sharing your pickup address publicly.</p></div>{loadingRequests ? <div className="donate-skeleton"><i /><i /><i /></div> : !localStorage.getItem("token") ? <p className="donate-empty">Sign in to view your requests.</p> : requests.length === 0 ? <p className="donate-empty">No pickup requests yet.</p> : <div className="donate-request-list">{requests.map((request) => <article className="donate-request" key={request._id}><span className="donate-request-icon"><Package size={19} /></span><div className="donate-request-info"><strong>{request.quantity} {label(request.itemType)}{request.quantity > 1 ? " items" : " item"}</strong><span>{request.description}</span><small>Pickup: {new Date(request.preferredDate).toLocaleDateString("en-IN")} · {label(request.preferredTimeSlot)}</small></div><div className="donate-request-state"><span className={`donate-state ${request.status}`}>{label(request.status)}</span>{["new", "pickup_scheduled"].includes(request.status) && <button onClick={() => cancel(request._id)}>Cancel</button>}</div></article>)}</div>}</section>
    </main>
  </>;
}

export default Donate;
