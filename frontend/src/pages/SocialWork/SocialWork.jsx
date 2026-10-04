import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Ambulance, ArrowLeft, BookOpen, CalendarDays, HeartPulse, MapPin, Phone, Search, Shield, Utensils, Users, Home, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/social-work.css";

const CATEGORIES = [
  { value: "free-food", title: "Free food", icon: Utensils, description: "Community meals and food support" },
  { value: "blood", title: "Blood support", icon: HeartPulse, description: "Blood banks and donation camps" },
  { value: "shelter", title: "Shelter", icon: Home, description: "Temporary shelter and support" },
  { value: "medical", title: "Medical", icon: Shield, description: "Hospitals, dispensaries and health camps" },
  { value: "helpline", title: "Helplines", icon: Phone, description: "Emergency and support numbers" },
  { value: "scholarship", title: "Scholarships", icon: BookOpen, description: "Education funding opportunities" },
  { value: "volunteer", title: "Volunteer", icon: Users, description: "Ways to support your community" },
];
const SUBTYPES = {
  blood: ["blood-bank", "donation-camp"],
  medical: ["government-hospital", "dispensary", "health-camp"],
  helpline: ["ambulance", "police", "women", "child", "mental-health", "other"],
};
const DISCLAIMER = "Timings can change. Please confirm with the organizer before visiting. RoomSlider only shares this information.";
const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not provided";
const label = (value = "") => value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

function SuggestPlace({ onClose }) {
  const [form, setForm] = useState({ category: "free-food", subType: "", name: "", area: "", address: "", contactNumber: "", description: "" });
  const [saving, setSaving] = useState(false);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/social/suggest", form);
      toast.success("Thank you. Your suggestion has been sent for review.");
      onClose();
    } catch (error) {
      toast.error(error?.response?.status === 401 ? "Sign in to suggest a place" : error?.response?.data?.message || "Suggestion could not be submitted");
    } finally {
      setSaving(false);
    }
  };
  return <div className="sw-overlay" onClick={onClose}><form className="sw-suggest" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
    <div className="sw-suggest-head"><div><h2>Suggest a place</h2><p>Our team will review the details before publishing.</p></div><button type="button" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
    <label>Category<select value={form.category} onChange={update("category")}>{CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.title}</option>)}</select></label>
    {SUBTYPES[form.category] && <label>Type<select value={form.subType} onChange={update("subType")}><option value="">Select type</option>{SUBTYPES[form.category].map((type) => <option key={type} value={type}>{label(type)}</option>)}</select></label>}
    <label>Place name<input required maxLength={150} value={form.name} onChange={update("name")} /></label>
    <label>Area<input required maxLength={100} value={form.area} onChange={update("area")} /></label>
    <label>Address<textarea required maxLength={400} value={form.address} onChange={update("address")} /></label>
    <label>Contact number (optional)<input inputMode="tel" maxLength={40} value={form.contactNumber} onChange={update("contactNumber")} /></label>
    <label>Details (optional)<textarea maxLength={1000} value={form.description} onChange={update("description")} /></label>
    <button className="sw-button" disabled={saving}>{saving ? "Sending..." : "Send suggestion"}</button>
  </form></div>;
}

function SocialWork() {
  const { category, slug } = useParams();
  const [places, setPlaces] = useState([]);
  const [place, setPlace] = useState(null);
  const [latestVerified, setLatestVerified] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ area: "", subType: "", search: "", today: false, openNow: false, upcoming: false });
  const [suggesting, setSuggesting] = useState(false);
  const selectedCategory = CATEGORIES.find((item) => item.value === category);

  useEffect(() => {
    if (category) return;
    api.get("/social").then(({ data }) => {
      const latest = (data.places || []).map((item) => item.lastVerifiedAt).filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0];
      setLatestVerified(latest || null);
    }).catch(() => toast.error("Directory verification details could not be loaded"));
  }, [category]);

  useEffect(() => {
    if (!slug) {
      setPlace(null);
      return;
    }
    let active = true;
    setLoading(true);
    api.get(`/social/${slug}`).then(({ data }) => { if (active) setPlace(data.place); })
      .catch(() => { if (active) setPlace(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (slug || !category || !selectedCategory) return;
    let active = true;
    setLoading(true);
    const params = { category };
    Object.entries(filters).forEach(([key, value]) => { if (value) params[key] = value; });
    api.get("/social", { params }).then(({ data }) => { if (active) setPlaces(data.places || []); })
      .catch(() => { if (active) setPlaces([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [category, filters, slug, selectedCategory]);

  const isLanding = !category;
  const subTypes = useMemo(() => SUBTYPES[category] || [], [category]);
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const pageTitle = slug && place
    ? `${place.name} | ${selectedCategory?.title || "Community support"} in Indore | RoomSlider`
    : selectedCategory
      ? `${selectedCategory.title} in Indore | Social Work | RoomSlider`
      : "Social Work Directory in Indore | RoomSlider";
  const pageDescription = slug && place
    ? `${place.name} in ${place.area}, Indore. View available details, timings and contact information.`
    : selectedCategory
      ? `${selectedCategory.description} in Indore. Browse published community support listings on RoomSlider.`
      : "Find community services, support, and ways to help across Indore with the RoomSlider Social Work directory.";
  const canonicalPath = slug && place
    ? `/social-work/${category}/${place.slug || place._id}`
    : category
      ? `/social-work/${category}`
      : "/social-work";
  const isPublishedPage = !category || Boolean(selectedCategory && (!slug || place));

  const seo = <Helmet>
    <title>{pageTitle}</title>
    <meta name="description" content={pageDescription} />
    <link rel="canonical" href={`https://www.roomslider.in${canonicalPath}`} />
    {!isPublishedPage && <meta name="robots" content="noindex, nofollow" />}
  </Helmet>;

  if (isLanding) return <>{seo}<main className="sw-page">
    <header className="sw-hero"><span className="sw-eyebrow">Indore community directory</span><h1>Social Work</h1><p>Find community services, support, and ways to help across Indore.</p></header>
    <div className="sw-category-grid">{CATEGORIES.map(({ value, title, icon: Icon, description }) => <Link key={value} to={`/social-work/${value}`} className="sw-category-card"><span className="sw-icon"><Icon size={22} /></span><strong>{title}</strong><span>{description}</span><span className="sw-arrow">Explore listings →</span></Link>)}</div>
    <p className="sw-disclaimer">{DISCLAIMER}</p>
    <p className="sw-last-verified">Last verified: {formatDate(latestVerified)}</p>
    <button className="sw-outline-button" onClick={() => setSuggesting(true)}>Suggest a place</button>
    {suggesting && <SuggestPlace onClose={() => setSuggesting(false)} />}
  </main></>;

  if (!selectedCategory) return <>{seo}<main className="sw-page"><Link to="/social-work" className="sw-back"><ArrowLeft size={16} /> Social Work</Link><h1>Category not found</h1></main></>;

  if (slug) return <>{seo}<main className="sw-page">
    <Link to={`/social-work/${category}`} className="sw-back"><ArrowLeft size={16} /> {selectedCategory.title}</Link>
    {loading ? <div className="sw-detail-skeleton"><i /><i /><i /></div> : !place ? <div className="sw-empty"><h1>Listing not found</h1><Link to={`/social-work/${category}`}>Browse other listings</Link></div> : <>
      <article className="sw-detail">
        <div className="sw-detail-heading"><span className="sw-eyebrow">{label(place.category)}{place.subType ? ` · ${label(place.subType)}` : ""}</span><h1>{place.name}</h1><p><MapPin size={16} /> {place.area}{place.address ? ` · ${place.address}` : ""}</p></div>
        <div className="sw-status-row">{place.openNow ? <span className="sw-status open">Open now</span> : place.nextOpening ? <span className="sw-status">Opens at {place.nextOpening}</span> : place.isOpen24x7 ? <span className="sw-status open">Open 24/7</span> : <span className="sw-status">Check timings</span>}{place.isVerified && <span className="sw-verified">Verified</span>}</div>
        {place.description && <p className="sw-description">{place.description}</p>}
        {place.whoCanCome && <section><h2>Who can come</h2><p>{place.whoCanCome}</p></section>}
        {place.category === "free-food" && <section><h2>Food information</h2><p>{place.extra?.foodType || "Details available from the organizer"}</p>{place.extra?.itemsServed?.length > 0 && <p>{place.extra.itemsServed.join(", ")}</p>}</section>}
        {place.category === "scholarship" && <section><h2>Eligibility and application</h2><p>{place.extra?.eligibility || "Contact the organizer for eligibility details."}</p>{place.extra?.lastDate && <p>Last date: {formatDate(place.extra.lastDate)}</p>}{place.extra?.link && <a href={place.extra.link} target="_blank" rel="noreferrer">Application information</a>}</section>}
        {place.schedule?.length > 0 && <section><h2>Weekly schedule</h2><div className="sw-hours">{place.schedule.map((row, index) => <div key={`${row.startTime}-${index}`}><strong>{row.days.join(", ") || "Schedule"}</strong><span>{row.startTime && row.endTime ? `${row.startTime}–${row.endTime}` : "Time not listed"}</span>{row.details && <small>{row.details}</small>}</div>)}</div></section>}
        {place.notes && <section><h2>Important notes</h2><p>{place.notes}</p></section>}
        <section className="sw-verify-note"><p>{DISCLAIMER}</p><span>Last verified: {formatDate(place.lastVerifiedAt)}</span></section>
        <div className="sw-detail-actions">{place.mapLink && <a className="sw-button" href={place.mapLink} target="_blank" rel="noreferrer"><MapPin size={16} /> Open in Maps</a>}{place.contactNumber && <a className={`sw-outline-button${category === "helpline" ? " sw-helpline-call" : ""}`} href={`tel:${place.contactNumber}`}><Phone size={16} /> {category === "helpline" ? "Call helpline now" : "Call"}</a>}</div>
      </article>
      {category === "blood" && <p className="sw-blood-notice">In an emergency call 108 or visit the nearest blood bank.</p>}
    </>}
  </main></>;

  return <>{seo}<main className="sw-page">
    <Link to="/social-work" className="sw-back"><ArrowLeft size={16} /> Social Work</Link>
    <header className="sw-list-heading"><div><span className="sw-eyebrow">{label(category)}</span><h1>{selectedCategory.title}</h1><p>{selectedCategory.description}</p></div><button className="sw-outline-button" onClick={() => setSuggesting(true)}>Suggest a place</button></header>
    {category === "blood" && <p className="sw-blood-notice">In an emergency call 108 or visit the nearest blood bank.</p>}
    <div className="sw-filter-panel">
      <label className="sw-search"><Search size={17} /><input placeholder="Search places" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} /></label>
      <select aria-label="Area" value={filters.area} onChange={(event) => updateFilter("area", event.target.value)}><option value="">All areas</option>{["Vijay Nagar", "Palasia", "Bhawarkuan", "Rajendra Nagar", "Sudama Nagar", "Bengali Square", "MG Road", "LIG Colony", "Rau", "Other"].map((area) => <option key={area}>{area}</option>)}</select>
      {subTypes.length > 0 && <select aria-label="Type" value={filters.subType} onChange={(event) => updateFilter("subType", event.target.value)}><option value="">All types</option>{subTypes.map((type) => <option key={type} value={type}>{label(type)}</option>)}</select>}
      <div className="sw-chips">{[["today", "Today"], ["openNow", "Open now"], ["upcoming", "Upcoming"]].map(([key, title]) => <button key={key} className={filters[key] ? "active" : ""} onClick={() => updateFilter(key, !filters[key])}>{title}</button>)}</div>
    </div>
    {loading ? <div className="sw-card-grid">{[1, 2, 3].map((key) => <div className="sw-card-skeleton" key={key}><i /><i /><i /></div>)}</div> : places.length === 0 ? <div className="sw-empty"><h2>No listings yet</h2><p>There are no published listings in this category. You can suggest a place for review.</p><button className="sw-button" onClick={() => setSuggesting(true)}>Suggest a place</button></div> : <div className="sw-card-grid">{places.map((item) => <article className={`sw-place-card${category === "helpline" ? " sw-helpline-card" : ""}`} key={item._id}>
      <div className="sw-card-title"><div><Link to={`/social-work/${category}/${item.slug || item._id}`}>{item.name}</Link><p><MapPin size={14} /> {item.area}</p></div>{item.isVerified && <span className="sw-verified">Verified</span>}</div>
      <div className="sw-card-status">{item.openNow ? "Open now" : item.nextOpening ? `Opens at ${item.nextOpening}` : item.isOpen24x7 ? "Open 24/7" : item.todayHours?.[0]?.startTime ? `Today ${item.todayHours[0].startTime}–${item.todayHours[0].endTime}` : item.eventDate ? `Event ${formatDate(item.eventDate)}` : "Timings not listed"}</div>
      {item.whoCanCome && <p>{item.whoCanCome}</p>}
      <div className="sw-card-actions">{item.mapLink && <a href={item.mapLink} target="_blank" rel="noreferrer"><MapPin size={15} /> Maps</a>}{item.contactNumber && <a className={category === "helpline" ? "sw-helpline-call" : ""} href={`tel:${item.contactNumber}`}><Phone size={15} /> {category === "helpline" ? "Call helpline now" : "Call"}</a>}<Link to={`/social-work/${category}/${item.slug || item._id}`}><CalendarDays size={15} /> Details</Link></div>
      <span className="sw-card-verified-date">Last verified: {formatDate(item.lastVerifiedAt)}</span>
    </article>)}</div>}
    <p className="sw-disclaimer">{DISCLAIMER}</p>
    {suggesting && <SuggestPlace onClose={() => setSuggesting(false)} />}
  </main></>;
}

export default SocialWork;
