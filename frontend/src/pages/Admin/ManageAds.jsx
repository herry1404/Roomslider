import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  BarChart3,
  Check,
  ExternalLink,
  Image,
  MapPin,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Store,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import cafes from "../../data/cafes";
import confirmAction from "../../utils/confirmAction";
import "../../styles/admin/theme.css";

const emptyForm = () => ({
  slot: "top",
  targetBy: "cafe",
  cafes: ["wowpav"],
  location: "bhawarkua",
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

const normalizeLinkUrl = (value) => {
  const link = value.trim();
  if (!link) return "";
  if (/^https?:\/\//i.test(link)) return link;
  return `https://${link.replace(/^\/\//, "")}`;
};

const getLoadError = (error) => {
  if (error.response?.status === 401) return "Your admin session has expired. Sign in again, then reload this page.";
  if (error.response?.status === 403) return "This account does not have permission to manage ads.";
  if (!error.response) return "Could not reach the server. Check your connection and try again.";
  return error.response.data?.message || "Could not load ads. Please try again.";
};

const loadAds = () => api.get("/promo-listings/admin").then(({ data }) => (
  Array.isArray(data.ads) ? data.ads : []
));

const getTarget = (ad) => {
  const targetBy = ad.targetBy || (ad.cafe === "all" ? "all" : "cafe");
  if (targetBy === "location") return `Location · ${ad.location || "—"}`;
  if (targetBy === "cafe") {
    const slugs = ad.cafes?.length ? ad.cafes : [ad.cafe].filter(Boolean);
    const names = slugs.map((slug) => cafes.find((cafe) => cafe.id === slug || (slug === "htlcafe" && cafe.id === "htl-cafe"))?.name || slug);
    return `Cafe${names.length > 1 ? "s" : ""} · ${names.join(", ") || "—"}`;
  }
  return "All cafes";
};

const getStatus = (ad) => {
  if (!ad.active) return "Inactive";
  const now = Date.now();
  if (ad.startsAt && new Date(ad.startsAt).getTime() > now) return "Scheduled";
  if (ad.endsAt && new Date(ad.endsAt).getTime() <= now) return "Expired";
  return "Live";
};

const getMenuUrl = (ad) => {
  if (ad.targetBy === "location") return null;
  const cafe = ad.cafes?.[0] || ad.cafe || "";
  if (!cafe || cafe === "all") return null;
  const knownLocations = { wowpav: "bhawarkua", waffleo: "bhawarkua", yuvanamritulya: "vishnupuri", "htl-cafe": "indrapuri", htlcafe: "indrapuri", biryanikendra: "sapnasangeeta" };
  const cafePath = cafe === "htlcafe" ? "htl-cafe" : cafe;
  const location = ad.location || knownLocations[cafe];
  return location ? `https://roomslider.in/cafe/${location}/${cafePath}` : null;
};

function ManageAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [slotFilter, setSlotFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchAds = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setAds(await loadAds());
      setLoadError("");
    } catch (error) {
      setLoadError(getLoadError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadAds()
      .then((loadedAds) => {
        if (active) {
          setAds(loadedAds);
          setLoadError("");
        }
      })
      .catch((error) => {
        if (active) setLoadError(getLoadError(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const counts = useMemo(() => ads.reduce((result, ad) => {
    const status = getStatus(ad);
    result.total += 1;
    if (status === "Live") result.live += 1;
    if (status === "Scheduled") result.scheduled += 1;
    return result;
  }, { total: 0, live: 0, scheduled: 0 }), [ads]);

  const filteredAds = useMemo(() => {
    const term = search.trim().toLowerCase();
    return ads.filter((ad) => {
      const matchesSearch = !term || [ad.text, ad.cafe, ad.location, getTarget(ad)]
        .some((value) => String(value || "").toLowerCase().includes(term));
      const matchesSlot = slotFilter === "all" || ad.slot === slotFilter;
      const matchesStatus = statusFilter === "all" || getStatus(ad).toLowerCase() === statusFilter;
      return matchesSearch && matchesSlot && matchesStatus;
    });
  }, [ads, search, slotFilter, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving || imageUploading) return;
    setPreviewOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(false);
  };

  const editAd = (ad) => {
    const targetBy = ad.targetBy || (ad.cafe === "all" ? "all" : "cafe");
    setEditingId(ad._id);
    setForm({
      slot: ad.slot || "top",
      targetBy,
      cafes: ad.cafes?.length ? ad.cafes : ad.cafe && ad.cafe !== "all" ? [ad.cafe] : [],
      location: ad.location || "",
      text: ad.text || "",
      logoUrl: ad.logoUrl || "",
      imageUrl: ad.imageUrl || "",
      linkUrl: ad.linkUrl || "",
      active: ad.active !== false,
      startsAt: toLocalDateTime(ad.startsAt),
      endsAt: toLocalDateTime(ad.endsAt),
    });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitAd = async (event) => {
    event.preventDefault();
    if (form.targetBy === "cafe" && !form.cafes.length) {
      toast.error("Choose at least one cafe for this ad.");
      return;
    }
    const imageField = form.slot === "top" ? "logoUrl" : "imageUrl";
    if (!form[imageField]) {
      toast.error("Upload an ad image before publishing.");
      return;
    }
    const normalizedLink = normalizeLinkUrl(form.linkUrl);
    try {
      const parsedLink = new URL(normalizedLink);
      if (parsedLink.protocol !== "https:" || !parsedLink.hostname) throw new Error("Invalid HTTPS URL");
    } catch {
      toast.error("Enter a valid website or offer link.");
      return;
    }
    setForm((current) => ({ ...current, linkUrl: normalizedLink }));
    setPreviewOpen(true);
  };

  const publishAd = async () => {
    const payload = {
      ...form,
      linkUrl: normalizeLinkUrl(form.linkUrl),
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
    };
    if (form.targetBy === "cafe") {
      payload.cafes = form.cafes;
      payload.cafe = form.cafes[0];
      delete payload.location;
    } else if (form.targetBy === "location") {
      payload.location = form.location.trim().toLowerCase();
      delete payload.cafe;
      delete payload.cafes;
    } else {
      delete payload.cafe;
      delete payload.cafes;
      delete payload.location;
    }
    if (form.slot === "top") delete payload.imageUrl;
    else delete payload.logoUrl;

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/promo-listings/admin/${editingId}`, payload);
        toast.success("Ad updated and published.");
      } else {
        await api.post("/promo-listings/admin", payload);
        toast.success("Ad created and published.");
      }
      setEditingId(null);
      setForm(emptyForm());
      setFormOpen(false);
      setPreviewOpen(false);
      await fetchAds(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save ad. Check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  const uploadAdImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }

    const imageField = form.slot === "top" ? "logoUrl" : "imageUrl";
    const data = new FormData();
    data.append("image", file);
    setImageUploading(true);
    try {
      const { data: result } = await api.post("/promo-listings/admin/upload", data);
      setForm((current) => ({ ...current, [imageField]: result.imageUrl }));
      toast.success("Ad image uploaded.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not upload the ad image.");
    } finally {
      setImageUploading(false);
    }
  };

  const toggleAd = async (ad) => {
    setPendingId(ad._id);
    try {
      await api.patch(`/promo-listings/admin/${ad._id}/active`, { active: !ad.active });
      setAds((current) => current.map((item) => item._id === ad._id ? { ...item, active: !ad.active } : item));
      toast.success(ad.active ? "Ad paused." : "Ad activated.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not change ad status.");
    } finally {
      setPendingId("");
    }
  };

  const deleteAd = async (ad) => {
    if (!await confirmAction(`Delete “${ad.text}”?`, { confirmText: "Delete" })) return;
    setPendingId(ad._id);
    try {
      await api.delete(`/promo-listings/admin/${ad._id}`);
      setAds((current) => current.filter((item) => item._id !== ad._id));
      toast.success("Ad deleted.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete ad.");
    } finally {
      setPendingId("");
    }
  };

  return (
    <main className="admin-page manage-ads">
      <div className="admin-page-header ads-header">
        <div>
          <span className="ads-eyebrow"><Megaphone size={14} /> CAFE MENU PROMOTIONS</span>
          <h1>Cafe Ads</h1>
          <p>Create and schedule the ads that appear on public cafe menu pages.</p>
        </div>
        <div className="ads-header-actions">
          <Link to="/admin/analytics?tab=listings" className="admin-btn secondary">
            <BarChart3 size={16} /> Ads analytics
          </Link>
          <button type="button" className="admin-btn secondary ads-refresh" onClick={() => fetchAds()} disabled={loading} aria-label="Refresh ads">
            <RefreshCw size={16} className={loading ? "ads-spinning" : ""} /> Refresh
          </button>
          <button type="button" className="admin-btn" onClick={openCreate}>
            <Plus size={18} /> Create ad
          </button>
        </div>
      </div>

      <div className="ads-summary" aria-label="Ad overview">
        <div><span>Total ads</span><strong>{counts.total}</strong></div>
        <div><span>Live now</span><strong>{counts.live}</strong></div>
        <div><span>Scheduled</span><strong>{counts.scheduled}</strong></div>
      </div>

      {formOpen && (
        <form className="ads-form admin-analytics-card" onSubmit={submitAd}>
          <div className="ads-form-heading">
            <div>
              <span className="ads-eyebrow">{editingId ? "UPDATE PROMOTION" : "NEW PROMOTION"}</span>
              <h2>{editingId ? "Edit cafe ad" : "Create a cafe ad"}</h2>
              <p>Choose where it appears, add the creative, and publish now or schedule it.</p>
            </div>
            <button type="button" className="admin-icon-btn" onClick={closeForm} aria-label="Close ad form" disabled={saving || imageUploading}><X size={20} /></button>
          </div>

          <div className="ads-form-grid">
            <label>
              <span>Ad placement</span>
              <select value={form.slot} onChange={(event) => setForm({ ...form, slot: event.target.value })}>
                <option value="top">Top banner · Logo + short text</option>
                <option value="bottom">Bottom banner · Image + text</option>
              </select>
              <small>Up to 10 active ads per placement rotate automatically. People can also swipe or tap the arrows.</small>
            </label>
            <label>
              <span>Show this ad on</span>
              <select value={form.targetBy} onChange={(event) => setForm({
                ...form,
                targetBy: event.target.value,
                cafes: event.target.value === "cafe" ? (form.cafes.length ? form.cafes : ["wowpav"]) : [],
                location: event.target.value === "location" ? (form.location || "bhawarkua") : "",
              })}>
                <option value="cafe">Selected cafes</option>
                <option value="location">All cafes in one location</option>
                <option value="all">All cafes and locations</option>
              </select>
              <small>
                {form.targetBy === "cafe" ? "Choose one or more cafes from the list below." : form.targetBy === "location" ? "Matches the location in the menu URL, e.g. Bhawarkua." : "Use this for a promotion that applies everywhere."}
              </small>
            </label>

            {form.targetBy === "cafe" && (
              <fieldset className="ads-cafe-picker ads-wide">
                <legend><Store size={14} /> Choose cafes</legend>
                <p>Select one or more cafes where this promotion should appear.</p>
                <div className="ads-cafe-options">
                  {cafes.map((cafe) => (
                    <label className="ads-cafe-option" key={cafe.id}>
                      <input
                        type="checkbox"
                        checked={form.cafes.includes(cafe.id)}
                        onChange={(event) => setForm((current) => ({
                          ...current,
                          cafes: event.target.checked
                            ? [...current.cafes, cafe.id]
                            : current.cafes.filter((id) => id !== cafe.id),
                        }))}
                      />
                      <span><strong>{cafe.name}</strong><small>{cafe.area}</small></span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {form.targetBy === "location" && (
              <label>
                <span><MapPin size={14} /> Location slug</span>
                <input required maxLength={100} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="bhawarkua" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value.toLowerCase() })} />
                <small>Use the location part of the public menu URL, e.g. <code>bhawarkua</code>.</small>
              </label>
            )}
            <label className="ads-wide">
              <span>Ad message</span>
              <input required maxLength={120} placeholder="Short message customers will see" value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} />
              <small>Up to 120 characters.</small>
            </label>
            <div className="ads-wide ads-upload">
              <span><Image size={14} /> Ad image</span>
              <input ref={imageInputRef} className="ads-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAdImage} disabled={imageUploading || saving} />
              <div className="ads-upload-control">
                {(form.slot === "top" ? form.logoUrl : form.imageUrl) && <img src={form.slot === "top" ? form.logoUrl : form.imageUrl} alt="Ad image preview" />}
                <div>
                  <strong>{form.slot === "top" ? "Square logo or brand mark" : "Wide banner image"}</strong>
                  <small>{imageUploading ? "Uploading image…" : "JPG, PNG, or WebP · 5 MB max"}</small>
                </div>
                <button type="button" className="admin-btn secondary" onClick={() => imageInputRef.current?.click()} disabled={imageUploading || saving}>
                  <Image size={16} /> {imageUploading ? "Uploading…" : (form.slot === "top" ? form.logoUrl : form.imageUrl) ? "Change image" : "Upload image"}
                </button>
              </div>
              {imageUploading && <span className="ads-uploaded"><RefreshCw size={14} className="ads-spinning" /> Uploading image…</span>}
              {(form.slot === "top" ? form.logoUrl : form.imageUrl) && !imageUploading && <span className="ads-uploaded"><Check size={14} /> Image ready to preview</span>}
            </div>
            <label className="ads-wide">
              <span><ExternalLink size={14} /> Ad ka link</span>
              <input required type="text" inputMode="url" autoComplete="url" placeholder="roomslider.in ya https://roomslider.in" value={form.linkUrl} onChange={(event) => setForm({ ...form, linkUrl: event.target.value })} onBlur={(event) => setForm((current) => ({ ...current, linkUrl: normalizeLinkUrl(event.target.value) }))} />
              <small>https:// khud lag jayega. Customer ad tap karke yahan jayega.</small>
            </label>
            <label>
              <span><CalendarClock size={14} /> Start date <em>Optional</em></span>
              <input type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
              <small>Leave blank to start as soon as the ad is active.</small>
            </label>
            <label>
              <span><CalendarClock size={14} /> End date <em>Optional</em></span>
              <input type="datetime-local" min={form.startsAt || undefined} value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} />
              <small>Leave blank to run until you pause it.</small>
            </label>
            <label className="ads-active">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
              <span><strong>Ad is active</strong><small>Turn off to save it without showing it.</small></span>
            </label>
          </div>

          {form.slot === "top" && form.logoUrl && (
            <div className="ads-live-preview">
              <span>PREVIEW</span>
              <div><img src={form.logoUrl} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /><b>{form.text || "Your ad message"}</b><small>Ad</small></div>
            </div>
          )}
          {form.slot === "bottom" && form.imageUrl && (
            <div className="ads-live-preview">
              <span>PREVIEW</span>
              <div className="ads-bottom-preview"><img src={form.imageUrl} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /><b>{form.text || "Your ad message"}</b><small>Ad</small></div>
            </div>
          )}

          <div className="ads-form-actions">
            <button type="button" className="admin-btn secondary" onClick={closeForm} disabled={saving || imageUploading}>Cancel</button>
            <button type="submit" className="admin-btn" disabled={saving || imageUploading}>
              <Check size={16} /> Preview ad
            </button>
          </div>
        </form>
      )}

      {previewOpen && (
        <div className="ads-preview-backdrop" role="presentation">
          <section className="ads-preview-dialog admin-analytics-card" role="dialog" aria-modal="true" aria-labelledby="ads-preview-title">
            <div className="ads-form-heading">
              <div><span className="ads-eyebrow">CHECK BEFORE PUBLISHING</span><h2 id="ads-preview-title">Ad preview</h2><p>This is how the promotion will look on the menu.</p></div>
              <button type="button" className="admin-icon-btn" onClick={() => setPreviewOpen(false)} aria-label="Close preview" disabled={saving}><X size={20} /></button>
            </div>
            <div className={`ads-customer-preview ${form.slot === "bottom" ? "wide" : ""}`}>
              {form.slot === "top" && <img src={form.logoUrl} alt="" />}
              {form.slot === "bottom" && <img src={form.imageUrl} alt="" />}
              <div><small>ADVERTISEMENT</small><strong>{form.text}</strong><span>Visit advertiser ↗</span></div>
            </div>
            <p className="ads-preview-destination">Shown on: <strong>{getTarget({ ...form, cafe: form.cafes[0] })}</strong></p>
            <p className="ads-preview-destination">Link: <strong>{normalizeLinkUrl(form.linkUrl)}</strong></p>
            <p className="ads-preview-destination">Placement: <strong>{form.slot === "top" ? "Above the menu search bar" : "Below the menu items"}</strong></p>
            <div className="ads-form-actions">
              <button type="button" className="admin-btn secondary" onClick={() => setPreviewOpen(false)} disabled={saving}>Go back and edit</button>
              <button type="button" className="admin-btn" onClick={publishAd} disabled={saving}>
                <Check size={16} /> {saving ? "Publishing..." : editingId ? "Confirm changes" : "Publish ad"}
              </button>
            </div>
          </section>
        </div>
      )}

      <div className="ads-toolbar">
        <label className="ads-search">
          <Search size={17} />
          <input type="search" placeholder="Search ad, cafe, or location…" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <select aria-label="Filter by placement" value={slotFilter} onChange={(event) => setSlotFilter(event.target.value)}>
          <option value="all">All placements</option>
          <option value="top">Top banner</option>
          <option value="bottom">Bottom banner</option>
        </select>
        <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="live">Live</option>
          <option value="scheduled">Scheduled</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="ads-state"><RefreshCw size={20} className="ads-spinning" /><p>Loading cafe ads…</p></div>
      ) : loadError ? (
        <div className="ads-state ads-error" role="alert">
          <Megaphone size={28} />
          <h2>Ads list could not load</h2>
          <p>{loadError}</p>
          <button type="button" className="admin-btn" onClick={() => fetchAds()}><RefreshCw size={16} /> Try again</button>
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="ads-state">
          <Megaphone size={28} />
          <h2>{ads.length ? "No matching ads" : "No ads yet"}</h2>
          <p>{ads.length ? "Try changing the search or filters." : "Create your first promotion to show it on a cafe menu."}</p>
          {!ads.length && <button type="button" className="admin-btn" onClick={openCreate}><Plus size={17} /> Create your first ad</button>}
        </div>
      ) : (
        <div className="ads-list">
          {filteredAds.map((ad) => {
            const status = getStatus(ad);
            const assetUrl = ad.slot === "top" ? ad.logoUrl : ad.imageUrl;
            const menuUrl = getMenuUrl(ad);
            return (
              <article className="ads-card" key={ad._id}>
                <div className={`ads-card-art ${ad.slot === "bottom" ? "wide" : ""}`}>
                  {assetUrl ? <img src={assetUrl} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /> : <Megaphone size={22} />}
                </div>
                <div className="ads-card-content">
                  <div className="ads-card-topline">
                    <span className={`ads-status ${status.toLowerCase()}`}><i />{status}</span>
                    <span className="ads-placement">{ad.slot === "top" ? "Top banner" : "Bottom banner"}</span>
                  </div>
                  <h2>{ad.text}</h2>
                  <p className="ads-target">{getTarget(ad)}</p>
                  <p className="ads-dates">
                    {ad.startsAt ? `Starts ${new Date(ad.startsAt).toLocaleString()}` : "Starts when active"}
                    {ad.endsAt ? ` · Ends ${new Date(ad.endsAt).toLocaleString()}` : " · No end date"}
                  </p>
                  {menuUrl && <a className="ads-menu-link" href={menuUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open menu page</a>}
                </div>
                <div className="ads-card-actions">
                  <button type="button" className="admin-btn secondary" onClick={() => toggleAd(ad)} disabled={pendingId === ad._id} aria-label={`${ad.active ? "Pause" : "Activate"} ${ad.text}`}>
                    {ad.active ? <ToggleRight size={17} /> : <ToggleLeft size={17} />} {ad.active ? "Pause" : "Activate"}
                  </button>
                  <button type="button" className="admin-icon-btn accent" onClick={() => editAd(ad)} aria-label={`Edit ${ad.text}`} title="Edit ad"><Pencil size={17} /></button>
                  <button type="button" className="admin-icon-btn danger" onClick={() => deleteAd(ad)} disabled={pendingId === ad._id} aria-label={`Delete ${ad.text}`} title="Delete ad"><Trash2 size={17} /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <style>{`
        .manage-ads{--admin-accent:#16a34a}
        .manage-ads .admin-btn:not(.secondary){background:#16a34a;color:#fff;box-shadow:0 8px 20px #16a34a33}
        .ads-header{align-items:flex-end}
        .ads-eyebrow{display:flex;align-items:center;gap:6px;color:#4ade80;font-size:10px;font-weight:800;letter-spacing:.12em;margin-bottom:7px}
        .ads-header-actions{display:flex;gap:9px}
        .ads-refresh{padding:10px 13px}
        .ads-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 18px}
        .ads-summary>div{padding:15px 17px;border:1px solid var(--admin-border);border-radius:14px;background:var(--admin-card)}
        .ads-summary span{display:block;color:var(--admin-muted);font-size:12px}
        .ads-summary strong{display:block;margin-top:6px;font-size:23px}
        .ads-form{margin:0 0 20px}
        .ads-form-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:20px}
        .ads-form-heading h2{margin:0 0 4px;font-size:19px}
        .ads-form-heading p{color:var(--admin-muted);font-size:12px}
        .ads-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
        .ads-form-grid label{display:grid;align-content:start;gap:7px;min-width:0;color:var(--admin-muted);font-size:12px}
        .ads-form-grid label>span{display:flex;align-items:center;gap:6px;color:var(--admin-text);font-size:13px;font-weight:700}
        .ads-form-grid label em{font-size:10px;font-style:normal;color:var(--admin-muted);font-weight:500}
        .ads-form-grid input:not([type=checkbox]),.ads-form-grid select{box-sizing:border-box;width:100%;min-width:0;min-height:42px;padding:10px 12px;color:var(--admin-text);background:var(--admin-bg);border:1px solid var(--admin-border);border-radius:10px}
        .ads-form-grid input:focus,.ads-form-grid select:focus{outline:2px solid #16a34a55;border-color:#16a34a}
        .ads-form-grid small{color:var(--admin-muted);font-size:11px;line-height:1.45}
        .ads-upload{display:grid;gap:8px;color:var(--admin-muted);font-size:12px}
        .ads-upload>span{display:flex;align-items:center;gap:6px;color:var(--admin-text);font-size:13px;font-weight:700}
        .ads-cafe-picker{min-width:0;margin:0;padding:14px;border:1px solid var(--admin-border);border-radius:12px}
        .ads-cafe-picker legend{display:flex;align-items:center;gap:6px;padding:0 6px;color:var(--admin-text);font-size:13px;font-weight:700}
        .ads-cafe-picker>p{margin:0 0 10px;color:var(--admin-muted);font-size:11px}
        .ads-cafe-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}
        .ads-cafe-option{display:flex!important;grid-template-columns:none!important;align-items:center;gap:9px!important;padding:10px;border:1px solid var(--admin-border);border-radius:10px;background:var(--admin-bg);cursor:pointer}
        .ads-cafe-option:has(input:checked){border-color:#16a34a;background:#16a34a12}
        .ads-cafe-option input{width:16px;height:16px;accent-color:#16a34a}
        .ads-cafe-option span{display:grid;gap:2px}
        .ads-cafe-option strong{color:var(--admin-text);font-size:12px}
        .ads-cafe-option small{font-size:10px!important}
        .ads-file-input{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;clip-path:inset(50%)}
        .ads-upload-control{display:flex;align-items:center;gap:12px;min-height:76px;padding:11px;border:1px dashed var(--admin-border);border-radius:12px;background:var(--admin-bg)}
        .ads-upload-control>img{width:56px;height:56px;flex:none;border-radius:8px;object-fit:cover;background:var(--admin-card)}
        .ads-upload-control>div{display:grid;flex:1;gap:4px;min-width:0}
        .ads-upload-control strong{color:var(--admin-text);font-size:12px}
        .ads-upload-control .admin-btn{white-space:nowrap}
        .ads-upload .ads-uploaded{display:flex;align-items:center;gap:5px;color:#4ade80;font-size:11px}
        .ads-form-grid code{color:#86efac}
        .ads-wide{grid-column:1/-1}
        .ads-active{display:flex!important;grid-column:1/-1;align-items:center;gap:10px!important;padding:11px 12px;border:1px solid var(--admin-border);border-radius:10px}
        .ads-active input{width:17px;height:17px;accent-color:#16a34a}
        .ads-active span{display:grid;gap:2px}
        .ads-active strong{color:var(--admin-text);font-size:12px}
        .ads-form-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px}
        .ads-live-preview{margin-top:16px;padding:12px;border:1px dashed var(--admin-border);border-radius:12px}
        .ads-live-preview>span{display:block;color:var(--admin-muted);font-size:9px;font-weight:800;letter-spacing:.12em;margin-bottom:8px}
        .ads-live-preview>div{display:flex;align-items:center;gap:10px;min-height:54px;padding:9px 12px;border:1px solid var(--admin-border);border-radius:10px;background:var(--admin-bg)}
        .ads-live-preview img{width:34px;height:34px;object-fit:contain;border-radius:5px}
        .ads-live-preview b{flex:1;color:var(--admin-text);font-size:12px}
        .ads-live-preview small{color:var(--admin-muted);font-size:9px}
        .ads-live-preview .ads-bottom-preview{display:grid;gap:7px}
        .ads-live-preview .ads-bottom-preview img{width:100%;height:92px;object-fit:cover}
        .ads-preview-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;overflow-y:auto;padding:20px;background:#020617b8}
        .ads-preview-dialog{width:min(100%,540px);max-height:calc(100vh - 40px);overflow-y:auto}
        .ads-customer-preview{display:flex;align-items:center;gap:12px;padding:14px;border:1px solid var(--admin-border);border-radius:14px;background:var(--admin-bg)}
        .ads-customer-preview>img{width:56px;height:56px;flex:none;object-fit:contain;border-radius:10px;background:#fff}
        .ads-customer-preview>div{display:grid;gap:5px;min-width:0}
        .ads-customer-preview small{color:var(--admin-muted);font-size:10px;font-weight:800;letter-spacing:.08em}
        .ads-customer-preview strong{color:var(--admin-text);overflow-wrap:anywhere}
        .ads-customer-preview span{color:#4ade80;font-size:12px;font-weight:700}
        .ads-customer-preview.wide{display:grid;grid-template-columns:1fr}
        .ads-customer-preview.wide>img{width:100%;height:180px;object-fit:cover}
        .ads-preview-destination{margin-top:12px;color:var(--admin-muted);font-size:12px;overflow-wrap:anywhere}
        .ads-preview-destination strong{color:var(--admin-text);font-weight:600}
        .ads-toolbar{display:flex;align-items:center;gap:9px;margin:20px 0 12px;padding:10px;border:1px solid var(--admin-border);border-radius:13px;background:var(--admin-card)}
        .ads-search{position:relative;display:flex;align-items:center;flex:1;min-width:160px;color:var(--admin-muted)}
        .ads-search svg{position:absolute;left:10px}
        .ads-search input,.ads-toolbar select{width:100%;min-height:38px;border:1px solid var(--admin-border);border-radius:9px;background:var(--admin-bg);color:var(--admin-text);font:inherit;font-size:12px}
        .ads-search input{padding:8px 10px 8px 34px}
        .ads-toolbar select{width:auto;min-width:128px;padding:8px}
        .ads-list{display:grid;gap:10px}
        .ads-card{display:grid;grid-template-columns:72px minmax(0,1fr) auto;align-items:center;gap:14px;padding:14px;border:1px solid var(--admin-border);border-radius:14px;background:var(--admin-card)}
        .ads-card-art{display:grid;place-items:center;width:72px;height:64px;overflow:hidden;border:1px solid var(--admin-border);border-radius:10px;background:var(--admin-bg);color:var(--admin-muted)}
        .ads-card-art img{width:100%;height:100%;object-fit:contain}
        .ads-card-art.wide{width:72px}
        .ads-card-art.wide img{object-fit:cover}
        .ads-card-content{min-width:0}
        .ads-card-topline{display:flex;align-items:center;gap:8px;margin-bottom:5px}
        .ads-status,.ads-placement{display:inline-flex;align-items:center;gap:5px;color:var(--admin-muted);font-size:10px}
        .ads-status{font-weight:700}
        .ads-status i{width:6px;height:6px;border-radius:50%;background:currentColor}
        .ads-status.live{color:#4ade80}
        .ads-status.scheduled{color:#fbbf24}
        .ads-status.expired,.ads-status.inactive{color:#94a3b8}
        .ads-placement{padding:3px 7px;border:1px solid var(--admin-border);border-radius:999px}
        .ads-card h2{overflow:hidden;margin:0;color:var(--admin-text);font-size:14px;text-overflow:ellipsis;white-space:nowrap}
        .ads-target,.ads-dates{margin-top:3px;color:var(--admin-muted);font-size:11px}
        .ads-menu-link{display:inline-flex;align-items:center;gap:5px;margin-top:6px;color:#86efac;font-size:11px;text-decoration:none}
        .ads-menu-link:hover{text-decoration:underline}
        .ads-card-actions{display:flex;align-items:center;gap:5px}
        .ads-card-actions .admin-btn{padding:7px 9px;font-size:11px}
        .ads-state{display:grid;justify-items:center;gap:8px;padding:44px 18px;border:1px dashed var(--admin-border);border-radius:14px;color:var(--admin-muted);text-align:center}
        .ads-state h2{margin:0;color:var(--admin-text);font-size:16px}
        .ads-state p{font-size:12px}
        .ads-state .admin-btn{margin-top:5px}
        .ads-spinning{animation:ads-spin 1s linear infinite}
        @keyframes ads-spin{to{transform:rotate(360deg)}}
        @media(max-width:720px){
          .ads-summary{gap:7px}
          .ads-summary>div{padding:12px}
          .ads-summary strong{font-size:20px}
          .ads-toolbar{flex-wrap:wrap}
          .ads-search{flex-basis:100%}
          .ads-toolbar select{flex:1;min-width:0}
          .ads-card{grid-template-columns:54px minmax(0,1fr);gap:10px;padding:11px}
          .ads-card-art{width:54px;height:54px}
          .ads-card-actions{grid-column:1/-1;justify-content:flex-end;border-top:1px solid var(--admin-border);padding-top:9px}
        }
        @media(max-width:520px){
          .ads-preview-backdrop{align-items:end;padding:10px}
          .ads-preview-dialog{max-height:calc(100vh - 20px)}
          .ads-header{align-items:flex-start}
          .ads-header-actions{width:100%}
          .ads-header-actions .admin-btn{flex:1;justify-content:center}
          .ads-form-grid{grid-template-columns:1fr}
          .ads-wide,.ads-active{grid-column:auto}
          .ads-cafe-picker.ads-wide{grid-column:1/-1}
          .ads-upload-control{flex-wrap:wrap}
          .ads-upload-control .admin-btn{flex:1;justify-content:center}
          .ads-card-topline{flex-wrap:wrap}
          .ads-dates{line-height:1.5}
        }
      `}</style>
    </main>
  );
}

export default ManageAds;
