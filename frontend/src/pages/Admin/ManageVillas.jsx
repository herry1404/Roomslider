import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Pencil, X, Building2, CalendarCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/admin/theme.css";
import "../../styles/admin/dashboard.css";

const blankForm = () => ({
  name: "",
  description: "",
  address: "",
  area: "",
  city: "Indore",
  latitude: "",
  longitude: "",
  nightlyRate: "",
  eventRate: "",
  maxGuests: "",
  bedrooms: "1",
  bathrooms: "1",
  amenities: "",
  isActive: true,
});

const fmtDate = (value) => new Date(value).toLocaleDateString("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function ManageVillas() {
  const [villas, setVillas] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [images, setImages] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      const [villaResponse, bookingResponse] = await Promise.all([
        api.get("/villas"),
        api.get("/villa-bookings/admin/all"),
      ]);
      setVillas(villaResponse.data.villas || []);
      setBookings(bookingResponse.data.bookings || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Villa data load nahi hui");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/villas"),
      api.get("/villa-bookings/admin/all"),
    ])
      .then(([villaResponse, bookingResponse]) => {
        if (!active) return;
        setVillas(villaResponse.data.villas || []);
        setBookings(bookingResponse.data.bookings || []);
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || "Villa data load nahi hui");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(blankForm());
    setImages([]);
    setModal(true);
  };

  const openEdit = (villa) => {
    setEditingId(villa._id);
    setForm({
      name: villa.name,
      description: villa.description || "",
      address: villa.address || "",
      area: villa.area || "",
      city: villa.city || "Indore",
      latitude: villa.location?.coordinates?.[1] ?? "",
      longitude: villa.location?.coordinates?.[0] ?? "",
      nightlyRate: villa.nightlyRate,
      eventRate: villa.eventRate,
      maxGuests: villa.maxGuests,
      bedrooms: villa.bedrooms || 0,
      bathrooms: villa.bathrooms || 0,
      amenities: (villa.amenities || []).join(", "),
      isActive: villa.isActive !== false,
    });
    setImages([]);
    setModal(true);
  };

  const useLocation = () => {
    if (!navigator.geolocation) return toast.error("Location is not supported");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setForm((current) => ({
        ...current,
        latitude: coords.latitude,
        longitude: coords.longitude,
      })),
      () => toast.error("Could not get location")
    );
  };

  const save = async (event) => {
    event.preventDefault();
    if (form.latitude === "" || form.longitude === "") {
      toast.error("Villa map coordinates are required");
      return;
    }
    try {
      setSaving(true);
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, String(value)));
      data.append("amenities", JSON.stringify(form.amenities.split(",").map((item) => item.trim()).filter(Boolean)));
      images.forEach((image) => data.append("images", image));
      if (editingId) {
        await api.put(`/villas/${editingId}`, data);
        toast.success("Villa updated");
      } else {
        await api.post("/villas", data);
        toast.success("Villa added");
      }
      setModal(false);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Villa save nahi hui");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (villa) => {
    if (!window.confirm(`Delete ${villa.name}?`)) return;
    try {
      await api.delete(`/villas/${villa._id}`);
      toast.success("Villa deleted");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Villa delete nahi hui");
    }
  };

  const completeBooking = async (booking) => {
    try {
      await api.patch(`/villa-bookings/admin/${booking._id}/complete`);
      toast.success("Booking marked completed");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking update nahi hui");
    }
  };

  if (loading) return <div className="admin-page"><p>Loading villas...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><h1>Villas & Reservations</h1><p>Stay and event rates, availability, and paid booking records.</p></div>
        <button className="admin-btn" onClick={openAdd}><Plus size={18} /> Add Villa</button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card"><div className="admin-stat-top"><span className="admin-stat-label">Villas</span><Building2 size={18} /></div><div className="admin-stat-value">{villas.length}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-top"><span className="admin-stat-label">Confirmed reservations</span><CalendarCheck size={18} /></div><div className="admin-stat-value">{bookings.filter((booking) => booking.status === "confirmed").length}</div></div>
      </div>

      <div className="admin-table-wrap">
        {villas.length === 0 ? <div className="admin-empty"><h3>No villas yet</h3><p>Add a villa to display and accept reservations.</p></div> : (
          <table className="admin-table">
            <thead><tr><th>Villa</th><th>Location</th><th>Stay / night</th><th>Event / day</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{villas.map((villa) => (
              <tr key={villa._id}>
                <td><div className="admin-row-thumb">{villa.images?.[0] && <img src={villa.images[0]} alt={villa.name} />}<span>{villa.name}</span></div></td>
                <td>{villa.area}, {villa.city}</td><td>₹{villa.nightlyRate}</td><td>₹{villa.eventRate}</td><td>{villa.maxGuests}</td>
                <td><span className={`admin-badge ${villa.isActive ? "green" : ""}`}>{villa.isActive ? "Public" : "Hidden"}</span></td>
                <td><div className="admin-row-actions"><button className="admin-icon-btn accent" title="Edit" onClick={() => openEdit(villa)}><Pencil size={16} /></button><button className="admin-icon-btn danger" title="Delete" onClick={() => remove(villa)}><Trash2 size={16} /></button></div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      <div className="dashboard-section">
        <h3>Villa reservations</h3>
        {bookings.length === 0 ? <p>No reservations yet.</p> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Guest</th><th>Villa</th><th>Type / dates</th><th>Guests</th><th>Amount</th><th>Payment</th><th>Status</th><th /></tr></thead>
              <tbody>{bookings.map((booking) => (
                <tr key={booking._id}>
                  <td>{booking.guest?.name || "Guest"}<br /><small>{booking.guest?.phone || booking.guest?.email}</small></td>
                  <td>{booking.villa?.name || "Villa"}</td>
                  <td>{booking.bookingType}<br /><small>{fmtDate(booking.startDate)} – {fmtDate(booking.endDate)}</small></td>
                  <td>{booking.guestCount}</td><td>₹{booking.amount}</td>
                  <td>{booking.paymentStatus}</td><td>{booking.status}</td>
                  <td>{booking.status === "confirmed" && <button className="admin-btn secondary" onClick={() => completeBooking(booking)}>Complete</button>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="villa-admin-overlay" onClick={() => setModal(false)}>
          <form className="villa-admin-form" onSubmit={save} onClick={(event) => event.stopPropagation()}>
            <button className="villa-admin-close" type="button" onClick={() => setModal(false)}><X size={20} /></button>
            <h2>{editingId ? "Edit Villa" : "Add Villa"}</h2>
            <input placeholder="Villa name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <textarea placeholder="Villa description" required rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <input placeholder="Full address" required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            <div className="villa-admin-form-row"><input placeholder="Area" required value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} /><input placeholder="City" required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></div>
            <button className="admin-btn secondary" type="button" onClick={useLocation}><MapPin size={16} /> Use current location</button>
            <div className="villa-admin-form-row"><input type="number" step="any" placeholder="Latitude" required value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} /><input type="number" step="any" placeholder="Longitude" required value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} /></div>
            <div className="villa-admin-form-row"><label>Stay rate / night<input type="number" min="1" required value={form.nightlyRate} onChange={(event) => setForm({ ...form, nightlyRate: event.target.value })} /></label><label>Party/event rate / day<input type="number" min="1" required value={form.eventRate} onChange={(event) => setForm({ ...form, eventRate: event.target.value })} /></label></div>
            <div className="villa-admin-form-row"><label>Max guests<input type="number" min="1" max="500" required value={form.maxGuests} onChange={(event) => setForm({ ...form, maxGuests: event.target.value })} /></label><label>Bedrooms<input type="number" min="0" value={form.bedrooms} onChange={(event) => setForm({ ...form, bedrooms: event.target.value })} /></label><label>Bathrooms<input type="number" min="0" value={form.bathrooms} onChange={(event) => setForm({ ...form, bathrooms: event.target.value })} /></label></div>
            <input placeholder="Amenities, comma separated" value={form.amenities} onChange={(event) => setForm({ ...form, amenities: event.target.value })} />
            <label>Villa photos<input type="file" accept="image/*" multiple onChange={(event) => setImages(Array.from(event.target.files || []))} /></label>
            <label><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Publicly bookable</label>
            <button className="admin-btn" disabled={saving}>{saving ? "Saving..." : "Save Villa"}</button>
          </form>
        </div>
      )}
      <style>{`
        .villa-admin-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:#000a}
        .villa-admin-form{position:relative;display:grid;gap:12px;width:min(100%,640px);max-height:92dvh;overflow:auto;padding:24px;background:var(--admin-card);border:1px solid var(--admin-border);border-radius:16px}
        .villa-admin-form input:not([type=checkbox]):not([type=file]),.villa-admin-form textarea{box-sizing:border-box;width:100%;padding:10px 12px;color:var(--admin-text);background:var(--admin-bg);border:1px solid var(--admin-border);border-radius:9px;font:inherit}
        .villa-admin-form input[type=file]{max-width:100%;margin-top:8px}
        .villa-admin-form label{display:grid;gap:6px;color:var(--admin-muted);font-size:13px}
        .villa-admin-form label:has([type=checkbox]){display:flex;align-items:center}
        .villa-admin-form-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px}
        .villa-admin-close{position:absolute;right:12px;top:12px;color:var(--admin-muted);background:none;border:0}
      `}</style>
    </div>
  );
}

export default ManageVillas;
