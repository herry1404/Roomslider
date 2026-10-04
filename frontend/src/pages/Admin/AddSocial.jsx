import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import indoreAreas from "../../data/indoreAreas";
import "../../styles/admin/theme.css";
import "../../styles/admin/furniture-admin.css";

const CATEGORIES = ["free-food", "blood", "shelter", "medical", "helpline", "scholarship", "volunteer"];
const SUBTYPES = { blood: ["blood-bank", "donation-camp"], medical: ["government-hospital", "dispensary", "health-camp"], helpline: ["ambulance", "police", "women", "child", "mental-health", "other"] };
const DAYS = ["Daily", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const initial = { category: "free-food", subType: "", name: "", area: "", address: "", lng: "", lat: "", mapLink: "", organizer: "", description: "", contactNumber: "", alternateNumber: "", isOpen24x7: false, schedule: [], eventDate: "", eventEndDate: "", whoCanCome: "", notes: "", foodType: "", itemsServed: "", eligibility: "", lastDate: "", scholarshipLink: "", isVerified: false, isActive: false };
const title = (value = "") => value.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");

function AddSocial() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/social/admin/${id}`).then(({ data }) => {
      const place = data.place;
      const [lng, lat] = place.location?.coordinates || ["", ""];
      setForm({
        ...initial,
        ...place,
        lng: lng === "" ? "" : String(lng),
        lat: lat === "" ? "" : String(lat),
        eventDate: place.eventDate ? new Date(place.eventDate).toISOString().slice(0, 10) : "",
        eventEndDate: place.eventEndDate ? new Date(place.eventEndDate).toISOString().slice(0, 10) : "",
        lastDate: place.extra?.lastDate ? new Date(place.extra.lastDate).toISOString().slice(0, 10) : "",
        foodType: place.extra?.foodType || "",
        itemsServed: (place.extra?.itemsServed || []).join(", "),
        eligibility: place.extra?.eligibility || "",
        scholarshipLink: place.extra?.link || "",
        schedule: place.schedule || [],
      });
    }).catch(() => toast.error("Listing could not be loaded")).finally(() => setLoading(false));
  }, [id]);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const updateSchedule = (index, key, value) => setForm((current) => ({ ...current, schedule: current.schedule.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row) }));
  const addSchedule = () => setForm((current) => ({ ...current, schedule: [...current.schedule, { days: [], startTime: "", endTime: "", details: "" }] }));
  const removeSchedule = (index) => setForm((current) => ({ ...current, schedule: current.schedule.filter((_, rowIndex) => rowIndex !== index) }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const extra = form.category === "free-food"
      ? { foodType: form.foodType, itemsServed: form.itemsServed.split(",").map((item) => item.trim()).filter(Boolean) }
      : form.category === "scholarship"
        ? { eligibility: form.eligibility, lastDate: form.lastDate, link: form.scholarshipLink }
        : {};
    const payload = { ...form, extra, schedule: JSON.stringify(form.schedule) };
    try {
      if (id) await api.put(`/social/${id}`, payload);
      else await api.post("/social", payload);
      toast.success(id ? "Listing updated" : "Listing added");
      navigate("/admin/social");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Listing could not be saved");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-page"><div className="admin-empty">Loading listing…</div></div>;

  return <div className="admin-page">
    <div className="admin-page-header"><div><h1>{id ? "Edit social listing" : "Add social listing"}</h1><p>Only verified information should be published.</p></div><Link to="/admin/social" className="admin-btn secondary">Back to listings</Link></div>
    <form className="fa-form" onSubmit={submit}>
      <div className="fa-grid">
        <div className="fa-field"><label>Category *</label><select required value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value, subType: "" }))}>{CATEGORIES.map((value) => <option key={value} value={value}>{title(value)}</option>)}</select></div>
        {SUBTYPES[form.category] && <div className="fa-field"><label>Type</label><select value={form.subType} onChange={update("subType")}><option value="">Select type</option>{SUBTYPES[form.category].map((value) => <option key={value} value={value}>{title(value)}</option>)}</select></div>}
        <div className="fa-field"><label>Name *</label><input required maxLength={150} value={form.name} onChange={update("name")} /></div>
        <div className="fa-field"><label>Area *</label><input required maxLength={100} list="social-area-options" value={form.area} onChange={update("area")} /><datalist id="social-area-options">{indoreAreas.map((area) => <option key={area.name} value={area.name} />)}</datalist></div>
        <div className="fa-field"><label>Organizer</label><input maxLength={150} value={form.organizer} onChange={update("organizer")} /></div>
      </div>
      <div className="fa-field"><label>Address *</label><textarea required rows={2} maxLength={400} value={form.address} onChange={update("address")} /></div>
      <div className="fa-grid">
        <div className="fa-field"><label>Longitude</label><input type="number" step="any" value={form.lng} onChange={update("lng")} /></div>
        <div className="fa-field"><label>Latitude</label><input type="number" step="any" value={form.lat} onChange={update("lat")} /></div>
        <div className="fa-field"><label>Map link</label><input type="url" value={form.mapLink} onChange={update("mapLink")} /></div>
      </div>
      <div className="fa-field"><label>Description</label><textarea rows={3} maxLength={2000} value={form.description} onChange={update("description")} /></div>
      <div className="fa-grid">
        <div className="fa-field"><label>Contact number</label><input inputMode="tel" maxLength={40} value={form.contactNumber} onChange={update("contactNumber")} /></div>
        <div className="fa-field"><label>Alternate number</label><input inputMode="tel" maxLength={40} value={form.alternateNumber} onChange={update("alternateNumber")} /></div>
        <div className="fa-field"><label>Who can come</label><input maxLength={500} value={form.whoCanCome} onChange={update("whoCanCome")} /></div>
      </div>
      <div className="fa-section">Weekly schedule</div>
      {form.schedule.map((row, index) => <div className="fa-field" key={index}>
        <div className="fa-grid"><div className="fa-field"><label>Days</label><select multiple value={row.days || []} onChange={(event) => updateSchedule(index, "days", Array.from(event.target.selectedOptions, (option) => option.value))}>{DAYS.map((day) => <option key={day}>{day}</option>)}</select></div><div className="fa-field"><label>Start time</label><input type="time" value={row.startTime || ""} onChange={(event) => updateSchedule(index, "startTime", event.target.value)} /></div><div className="fa-field"><label>End time</label><input type="time" value={row.endTime || ""} onChange={(event) => updateSchedule(index, "endTime", event.target.value)} /></div><div className="fa-field"><label>Details</label><input maxLength={300} value={row.details || ""} onChange={(event) => updateSchedule(index, "details", event.target.value)} /></div></div><button type="button" className="admin-btn secondary" onClick={() => removeSchedule(index)}>Remove schedule row</button>
      </div>)}
      <button type="button" className="admin-btn secondary" onClick={addSchedule}>Add schedule row</button>
      <div className="fa-section">Event dates (for camps and events)</div>
      <div className="fa-grid"><div className="fa-field"><label>Event date</label><input type="date" value={form.eventDate || ""} onChange={update("eventDate")} /></div><div className="fa-field"><label>Event end date</label><input type="date" value={form.eventEndDate || ""} onChange={update("eventEndDate")} /></div></div>
      {form.category === "free-food" && <><div className="fa-section">Food information</div><div className="fa-grid"><div className="fa-field"><label>Food type</label><input maxLength={100} value={form.foodType} onChange={update("foodType")} /></div><div className="fa-field"><label>Items served (comma separated)</label><input value={form.itemsServed} onChange={update("itemsServed")} /></div></div></>}
      {form.category === "scholarship" && <><div className="fa-section">Scholarship information</div><div className="fa-field"><label>Eligibility</label><textarea rows={2} maxLength={800} value={form.eligibility} onChange={update("eligibility")} /></div><div className="fa-grid"><div className="fa-field"><label>Last date</label><input type="date" value={form.lastDate} onChange={update("lastDate")} /></div><div className="fa-field"><label>Information link</label><input type="url" value={form.scholarshipLink} onChange={update("scholarshipLink")} /></div></div></>}
      <div className="fa-field"><label>Notes</label><textarea rows={2} maxLength={1000} value={form.notes} onChange={update("notes")} /></div>
      <div className="fa-checks"><label><input type="checkbox" checked={form.isOpen24x7} onChange={update("isOpen24x7")} /> Open 24/7</label><label><input type="checkbox" checked={form.isVerified} onChange={update("isVerified")} /> Verified</label><label><input type="checkbox" checked={form.isActive} onChange={update("isActive")} /> Published</label></div>
      <div className="fa-actions"><button className="admin-btn" disabled={saving}>{saving ? "Saving…" : id ? "Save listing" : "Create listing"}</button><Link to="/admin/social" className="admin-btn secondary">Cancel</Link></div>
    </form>
  </div>;
}

export default AddSocial;
