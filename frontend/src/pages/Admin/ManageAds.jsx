import { useEffect, useState } from "react";
import { Megaphone, Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import confirmAction from "../../utils/confirmAction";
import "../../styles/admin/theme.css";

const emptyForm = () => ({
  slot: "top",
  targetBy: "all",
  cafe: "",
  location: "",
  text: "",
  logoUrl: "",
  imageUrl: "",
  linkUrl: "",
  active: true,
  startsAt: "",
  endsAt: "",
});

const toLocalDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

function ManageAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await api.get("/ads/admin");
      setAds(response.data.ads || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load ads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.get("/ads/admin")
      .then((response) => {
        if (active) setAds(response.data.ads || []);
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || "Failed to load ads");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const editAd = (ad) => {
    setEditingId(ad._id);
    setForm({
      slot: ad.slot,
      targetBy: ad.targetBy || (ad.cafe === "all" ? "all" : "cafe"),
      cafe: ad.cafe === "all" ? "" : ad.cafe || "",
      location: ad.location || "",
      text: ad.text || "",
      logoUrl: ad.logoUrl || "",
      imageUrl: ad.imageUrl || "",
      linkUrl: ad.linkUrl || "",
      active: ad.active !== false,
      startsAt: toLocalDateTime(ad.startsAt),
      endsAt: toLocalDateTime(ad.endsAt),
    });
  };

  const submitAd = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
    };
    if (form.targetBy === "cafe") {
      payload.cafe = form.cafe.trim().toLowerCase();
      delete payload.location;
    } else if (form.targetBy === "location") {
      payload.location = form.location.trim().toLowerCase();
      delete payload.cafe;
    } else {
      delete payload.cafe;
      delete payload.location;
    }
    if (form.slot === "top") delete payload.imageUrl;
    else delete payload.logoUrl;

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/ads/admin/${editingId}`, payload);
        toast.success("Ad updated");
      } else {
        await api.post("/ads/admin", payload);
        toast.success("Ad created");
      }
      setEditingId(null);
      setForm(emptyForm());
      await fetchAds();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save ad");
    } finally {
      setSaving(false);
    }
  };

  const toggleAd = async (ad) => {
    try {
      await api.patch(`/ads/admin/${ad._id}/active`, { active: !ad.active });
      toast.success(ad.active ? "Ad deactivated" : "Ad activated");
      await fetchAds();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update ad");
    }
  };

  const deleteAd = async (ad) => {
    if (!await confirmAction("Delete this ad?", { confirmText: "Delete" })) return;
    try {
      await api.delete(`/ads/admin/${ad._id}`);
      toast.success("Ad deleted");
      await fetchAds();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete ad");
    }
  };

  return (
    <div className="admin-page manage-ads">
      <div className="admin-page-header">
        <div>
          <h1>Cafe Ads</h1>
          <p>Manage the top logo and bottom image ads shown on cafe menu pages.</p>
        </div>
        <button
          type="button"
          className="admin-btn"
          onClick={() => { setEditingId(null); setForm(emptyForm()); }}
        >
          <Plus size={18} /> New Ad
        </button>
      </div>

      <form className="ads-form admin-analytics-card" onSubmit={submitAd}>
        <h2>{editingId ? "Edit Ad" : "Create Ad"}</h2>
        <div className="ads-form-grid">
          <label>Slot
            <select value={form.slot} onChange={(event) => setForm({ ...form, slot: event.target.value })}>
              <option value="top">Top (logo)</option>
              <option value="bottom">Bottom (image)</option>
            </select>
          </label>
          <label>Target
            <select value={form.targetBy} onChange={(event) => setForm({ ...form, targetBy: event.target.value, cafe: "", location: "" })}>
              <option value="all">All locations and cafes</option>
              <option value="location">Specific location</option>
              <option value="cafe">Specific cafe</option>
            </select>
          </label>
          {form.targetBy === "location" && (
            <label>Location slug
              <input required maxLength={100} placeholder="e.g. indrapuri" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </label>
          )}
          {form.targetBy === "cafe" && (
            <label>Cafe slug
              <input required maxLength={100} placeholder="e.g. htl-cafe" value={form.cafe} onChange={(event) => setForm({ ...form, cafe: event.target.value })} />
            </label>
          )}
          <label className="ads-wide">Ad text
            <input required maxLength={120} value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} />
          </label>
          <label className="ads-wide">{form.slot === "top" ? "Logo URL (HTTPS)" : "Image URL (HTTPS)"}
            <input
              required
              type="url"
              placeholder="https://..."
              value={form.slot === "top" ? form.logoUrl : form.imageUrl}
              onChange={(event) => setForm({
                ...form,
                [form.slot === "top" ? "logoUrl" : "imageUrl"]: event.target.value,
              })}
            />
          </label>
          <label className="ads-wide">Link URL (HTTPS)
            <input required type="url" placeholder="https://..." value={form.linkUrl} onChange={(event) => setForm({ ...form, linkUrl: event.target.value })} />
          </label>
          <label>Starts at (optional)
            <input type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
          </label>
          <label>Ends at (optional)
            <input type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} />
          </label>
          <label className="ads-active"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Active</label>
        </div>
        <div className="ads-form-actions">
          {editingId && <button type="button" className="admin-btn secondary" onClick={() => { setEditingId(null); setForm(emptyForm()); }}><X size={16} /> Cancel</button>}
          <button type="submit" className="admin-btn" disabled={saving}>{saving ? "Saving..." : editingId ? "Save Changes" : "Create Ad"}</button>
        </div>
      </form>

      <div className="admin-table-wrap ads-table-wrap">
        {loading ? <p className="ads-message">Loading ads...</p> : ads.length === 0 ? (
          <div className="admin-empty"><h3>No ads yet</h3><p>Create an ad to show it on cafe menus.</p></div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Ad</th><th>Slot</th><th>Target</th><th>Schedule</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={ad._id}>
                  <td>
                    <div className="ads-preview">
                      {ad.slot === "top" && ad.logoUrl ? <img src={ad.logoUrl} alt="" /> : ad.imageUrl ? <img src={ad.imageUrl} alt="" /> : <Megaphone size={18} />}
                      <span>{ad.text}</span>
                    </div>
                  </td>
                  <td>{ad.slot}</td>
                  <td>{ad.targetBy === "location" ? `Location: ${ad.location}` : ad.targetBy === "cafe" || (ad.targetBy == null && ad.cafe !== "all") ? `Cafe: ${ad.cafe}` : "All locations and cafes"}</td>
                  <td className="ads-schedule">{ad.startsAt ? new Date(ad.startsAt).toLocaleString() : "Now"}{ad.endsAt ? ` – ${new Date(ad.endsAt).toLocaleString()}` : ""}</td>
                  <td><span className={`admin-badge ${ad.active ? "green" : ""}`}>{ad.active ? "Active" : "Inactive"}</span></td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="admin-icon-btn accent" title="Edit" aria-label={`Edit ${ad.text}`} onClick={() => editAd(ad)}><Pencil size={16} /></button>
                      <button type="button" className="admin-btn secondary ads-toggle" onClick={() => toggleAd(ad)}>{ad.active ? "Deactivate" : "Activate"}</button>
                      <button type="button" className="admin-icon-btn danger" title="Delete" aria-label={`Delete ${ad.text}`} onClick={() => deleteAd(ad)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <style>{`
        .manage-ads{--admin-accent:#16a34a}
        .manage-ads .admin-btn:not(.secondary){background:#16a34a;color:#fff;box-shadow:0 8px 20px #16a34a33}
        .ads-form{margin-bottom:20px}
        .ads-form h2{margin:0 0 16px;font-size:18px}
        .ads-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .ads-form-grid label{display:grid;gap:6px;color:var(--admin-muted);font-size:13px}
        .ads-form-grid input:not([type=checkbox]),.ads-form-grid select{box-sizing:border-box;width:100%;min-width:0;padding:10px 12px;color:var(--admin-text);background:var(--admin-bg);border:1px solid var(--admin-border);border-radius:10px}
        .ads-form-grid input:focus,.ads-form-grid select:focus{outline:1px solid #16a34a;border-color:#16a34a}
        .ads-wide{grid-column:1/-1}
        .ads-active{align-items:center;display:flex!important;gap:8px!important}
        .ads-active input{accent-color:#16a34a}
        .ads-form-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}
        .ads-message{padding:18px;color:var(--admin-muted)}
        .ads-preview{display:flex;align-items:center;gap:10px;min-width:180px}
        .ads-preview img{width:44px;height:36px;object-fit:contain;border-radius:6px;background:#fff}
        .ads-schedule{min-width:160px;color:var(--admin-muted)}
        .ads-toggle{padding:7px 10px;font-size:12px}
        @media(max-width:640px){.ads-form-grid{grid-template-columns:1fr}.ads-wide{grid-column:auto}.ads-table-wrap{overflow-x:auto}.ads-table-wrap .admin-table{min-width:760px}}
      `}</style>
    </div>
  );
}

export default ManageAds;
