import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  Eye,
  MousePointerClick,
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import toast from "react-hot-toast";
import api from "../../api/axios";
import confirmAction from "../../utils/confirmAction";
import "../../styles/admin/theme.css";

const emptyForm = () => ({
  slot: "top",
  targetBy: "cafe",
  cafe: "wowpav",
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

const getTarget = (ad) => {
  const targetBy = ad.targetBy || (ad.cafe === "all" ? "all" : "cafe");
  if (targetBy === "location") return `Location · ${ad.location || "—"}`;
  if (targetBy === "cafe") return `Cafe · ${ad.cafe || "—"}`;
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
  const cafe = ad.cafe || "";
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
  const [form, setForm] = useState(emptyForm);
  const [imageUploading, setImageUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [slotFilter, setSlotFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [analyticsRefresh, setAnalyticsRefresh] = useState(0);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const fetchAds = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const { data } = await api.get("/ads/admin");
      setAds(Array.isArray(data.ads) ? data.ads : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load ads. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/ads/admin")
      .then(({ data }) => {
        if (active) setAds(Array.isArray(data.ads) ? data.ads : []);
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || "Could not load ads. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/ads/admin/analytics", { params: { days: analyticsDays } })
      .then(({ data }) => {
        if (active) setAnalytics(data.analytics);
      })
      .catch((error) => {
        if (active) {
          setAnalytics(null);
          toast.error(error.response?.data?.message || "Cafe analytics could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setAnalyticsLoading(false);
      });
    return () => { active = false; };
  }, [analyticsDays, analyticsRefresh]);

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
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitAd = async (event) => {
    event.preventDefault();
    const imageField = form.slot === "top" ? "logoUrl" : "imageUrl";
    if (!form[imageField]) {
      toast.error("Upload an ad image before publishing.");
      return;
    }
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
        toast.success("Ad updated and published.");
      } else {
        await api.post("/ads/admin", payload);
        toast.success("Ad created and published.");
      }
      setEditingId(null);
      setForm(emptyForm());
      setFormOpen(false);
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
      const { data: result } = await api.post("/ads/admin/upload", data);
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
      await api.patch(`/ads/admin/${ad._id}/active`, { active: !ad.active });
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
      await api.delete(`/ads/admin/${ad._id}`);
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

      <section className="ads-analytics" aria-labelledby="ads-analytics-title">
        <div className="ads-analytics-heading">
          <div>
            <span className="ads-eyebrow"><Eye size={14} /> MENU + AD PERFORMANCE</span>
            <h2 id="ads-analytics-title">Cafe traffic analytics</h2>
            <p>Menu visits, audience by cafe and location, plus ad views and clicks.</p>
          </div>
          <label className="ads-range">
            <span>Reporting period</span>
            <select value={analyticsDays} onChange={(event) => {
              setAnalytics(null);
              setAnalyticsLoading(true);
              setAnalyticsDays(Number(event.target.value));
            }}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
        </div>

        {analyticsLoading && !analytics ? (
          <div className="ads-analytics-loading">Loading traffic analytics…</div>
        ) : analytics ? (
          <>
            <div className="ads-metric-grid">
              <article><span><Eye size={15} /> Menu views</span><strong>{(analytics.summary.menuViews || 0).toLocaleString("en-IN")}</strong></article>
              <article><span><Store size={15} /> Unique sessions</span><strong>{(analytics.summary.uniqueVisitors || 0).toLocaleString("en-IN")}</strong></article>
              <article><span><Image size={15} /> Ad impressions</span><strong>{(analytics.summary.adImpressions || 0).toLocaleString("en-IN")}</strong></article>
              <article><span><MousePointerClick size={15} /> Ad clicks</span><strong>{(analytics.summary.adClicks || 0).toLocaleString("en-IN")}</strong></article>
              <article><span>Ad click rate</span><strong>{analytics.summary.clickRate || 0}%</strong></article>
            </div>
            {!analytics.summary.menuViews && (
              <p className="ads-analytics-note">Traffic tracking is live for cafe menu pages. New activity will appear here as visitors open menus.</p>
            )}
            <div className="ads-analytics-grid">
              <article className="ads-chart-card">
                <h3>Daily menu views</h3>
                <div className="ads-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.dailyViews || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tickFormatter={(date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} minTickGap={25} stroke="#94a3b8" />
                      <YAxis allowDecimals={false} stroke="#94a3b8" />
                      <Tooltip labelFormatter={(date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} contentStyle={{ background: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
                      <Line type="monotone" dataKey="views" name="Menu views" stroke="#4ade80" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="uniqueVisitors" name="Unique visits" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>
              <article className="ads-chart-card">
                <h3>Menu views by location</h3>
                <div className="ads-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.byLocation || []} layout="vertical" margin={{ left: 14, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" allowDecimals={false} stroke="#94a3b8" />
                      <YAxis type="category" dataKey="location" width={100} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ background: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
                      <Bar dataKey="views" name="Menu views" fill="#4ade80" radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
              <article className="ads-chart-card">
                <h3>Where visitors came from</h3>
                <div className="ads-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.bySource || []} layout="vertical" margin={{ left: 14, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" allowDecimals={false} stroke="#94a3b8" />
                      <YAxis type="category" dataKey="source" width={110} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ background: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
                      <Bar dataKey="views" name="Menu views" fill="#a78bfa" radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
              <article className="ads-chart-card">
                <h3>Visitors by device platform</h3>
                <div className="ads-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.byPlatform || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="platform" stroke="#94a3b8" />
                      <YAxis allowDecimals={false} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ background: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
                      <Bar dataKey="views" name="Menu views" fill="#38bdf8" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </div>

            <div className="ads-report-grid">
              <article className="ads-report-card">
                <h3>Traffic by cafe and location</h3>
                {(analytics.byCafe || []).length ? (
                  <div className="ads-report-table-wrap">
                    <table className="ads-report-table">
                      <thead><tr><th>Cafe</th><th>Location</th><th>Views</th><th>Unique sessions</th></tr></thead>
                      <tbody>{analytics.byCafe.map((row) => (
                        <tr key={`${row.cafe}-${row.location}`}>
                          <td>{row.cafe}</td><td>{row.location}</td>
                          <td>{row.views.toLocaleString("en-IN")}</td>
                          <td>{row.uniqueVisitors.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                ) : <p className="ads-report-empty">No menu visits in this period yet.</p>}
              </article>
              <article className="ads-report-card">
                <h3>Ad performance</h3>
                {(analytics.adPerformance || []).length ? (
                  <div className="ads-performance-list">{analytics.adPerformance.map((row) => (
                    <div className="ads-performance-row" key={`${row.adId}-${row.cafe}-${row.location}`}>
                      <div><strong>{row.text}</strong><small>{row.cafe} · {row.location} · {row.slot || "ad"}</small></div>
                      <span>{row.impressions.toLocaleString("en-IN")} views</span>
                      <span>{row.clicks.toLocaleString("en-IN")} clicks</span>
                      <b>{row.clickRate}% CTR</b>
                    </div>
                  ))}</div>
                ) : <p className="ads-report-empty">Ad impressions and clicks will show here once ads are viewed.</p>}
              </article>
            </div>
          </>
        ) : (
          <div className="ads-analytics-error">
            <p>Analytics are temporarily unavailable.</p>
            <button type="button" className="admin-btn secondary" onClick={() => {
              setAnalyticsLoading(true);
              setAnalyticsRefresh((value) => value + 1);
            }}>Retry</button>
          </div>
        )}
      </section>

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
              <small>Choose the display format used on cafe menu pages.</small>
            </label>
            <label>
              <span>Show this ad on</span>
              <select value={form.targetBy} onChange={(event) => setForm({
                ...form,
                targetBy: event.target.value,
                cafe: event.target.value === "cafe" ? (form.cafe || "wowpav") : "",
                location: event.target.value === "location" ? (form.location || "bhawarkua") : "",
              })}>
                <option value="cafe">One cafe</option>
                <option value="location">All cafes in one location</option>
                <option value="all">All cafes and locations</option>
              </select>
              <small>
                {form.targetBy === "cafe" ? "Best for a single cafe, e.g. Wow Pav." : form.targetBy === "location" ? "Matches the location in the menu URL, e.g. Bhawarkua." : "Use this for a promotion that applies everywhere."}
              </small>
            </label>

            {form.targetBy === "cafe" && (
              <label>
                <span><Store size={14} /> Cafe slug</span>
                <input required maxLength={100} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="wowpav" value={form.cafe} onChange={(event) => setForm({ ...form, cafe: event.target.value.toLowerCase() })} />
                <small>Use the cafe part of its public menu URL. Wow Pav is <code>wowpav</code>.</small>
              </label>
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
            <label className="ads-wide ads-upload">
              <span><Image size={14} /> {form.slot === "top" ? "Upload logo image" : "Upload banner image"}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAdImage} disabled={imageUploading || saving} />
              <small>{imageUploading ? "Uploading image…" : `${form.slot === "top" ? "Square logo or brand mark." : "Wide banner image works best."} JPG, PNG, or WebP · 5 MB max.`}</small>
              {(form.slot === "top" ? form.logoUrl : form.imageUrl) && (
                <span className="ads-uploaded"><Check size={14} /> Image ready to publish</span>
              )}
            </label>
            <label className="ads-wide">
              <span><ExternalLink size={14} /> Click-through link (HTTPS)</span>
              <input required type="url" placeholder="https://your-offer-or-order-page.com" value={form.linkUrl} onChange={(event) => setForm({ ...form, linkUrl: event.target.value })} />
              <small>Customers open this link when they tap the ad.</small>
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
              <Check size={16} /> {saving ? "Publishing..." : editingId ? "Save changes" : "Publish ad"}
            </button>
          </div>
        </form>
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
        .ads-analytics{margin:0 0 20px;padding:16px;border:1px solid var(--admin-border);border-radius:16px;background:linear-gradient(145deg,#1e293b,#172235)}
        .ads-analytics-heading{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:15px}
        .ads-analytics-heading h2{margin:0;color:var(--admin-text);font-size:18px}
        .ads-analytics-heading p{margin-top:4px;color:var(--admin-muted);font-size:12px}
        .ads-range{display:grid;gap:5px;color:var(--admin-muted);font-size:10px}
        .ads-range select{min-height:36px;padding:7px 9px;border:1px solid var(--admin-border);border-radius:9px;background:var(--admin-bg);color:var(--admin-text)}
        .ads-metric-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}
        .ads-metric-grid article{min-width:0;padding:11px;border:1px solid var(--admin-border);border-radius:11px;background:#0f172a55}
        .ads-metric-grid article>span{display:flex;align-items:center;gap:5px;color:var(--admin-muted);font-size:10px}
        .ads-metric-grid strong{display:block;margin-top:7px;color:var(--admin-text);font-size:19px}
        .ads-analytics-note,.ads-analytics-loading,.ads-analytics-error{padding:13px;color:var(--admin-muted);font-size:12px}
        .ads-analytics-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}
        .ads-chart-card,.ads-report-card{min-width:0;padding:12px;border:1px solid var(--admin-border);border-radius:12px;background:#0f172a55}
        .ads-chart-card h3,.ads-report-card h3{margin:0 0 10px;color:var(--admin-text);font-size:13px}
        .ads-chart{width:100%;height:220px}
        .ads-report-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}
        .ads-report-table-wrap{overflow-x:auto}
        .ads-report-table{width:100%;border-collapse:collapse;font-size:11px}
        .ads-report-table th,.ads-report-table td{padding:8px 6px;border-bottom:1px solid var(--admin-border);text-align:left;white-space:nowrap}
        .ads-report-table th{color:var(--admin-muted);font-weight:600}
        .ads-report-table td{color:var(--admin-text)}
        .ads-report-empty{padding:10px 0;color:var(--admin-muted);font-size:11px}
        .ads-performance-list{display:grid;gap:8px}
        .ads-performance-row{display:grid;grid-template-columns:minmax(100px,1fr) auto auto auto;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--admin-border);font-size:10px}
        .ads-performance-row>div{display:grid;gap:3px;min-width:0}
        .ads-performance-row strong{overflow:hidden;color:var(--admin-text);text-overflow:ellipsis;white-space:nowrap;font-size:11px}
        .ads-performance-row small,.ads-performance-row span{color:var(--admin-muted)}
        .ads-performance-row b{color:#4ade80;white-space:nowrap}
        .ads-analytics-error{display:flex;align-items:center;justify-content:space-between;gap:10px}
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
        .ads-upload input[type=file]{box-sizing:border-box;width:100%;padding:9px 11px;color:var(--admin-text);background:var(--admin-bg);border:1px dashed var(--admin-border);border-radius:10px;font-size:12px}
        .ads-upload input[type=file]::file-selector-button{margin-right:10px;padding:7px 10px;border:0;border-radius:7px;background:#16a34a;color:#fff;font-weight:700;cursor:pointer}
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
          .ads-metric-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
          .ads-analytics-grid,.ads-report-grid{grid-template-columns:1fr}
          .ads-toolbar{flex-wrap:wrap}
          .ads-search{flex-basis:100%}
          .ads-toolbar select{flex:1;min-width:0}
          .ads-card{grid-template-columns:54px minmax(0,1fr);gap:10px;padding:11px}
          .ads-card-art{width:54px;height:54px}
          .ads-card-actions{grid-column:1/-1;justify-content:flex-end;border-top:1px solid var(--admin-border);padding-top:9px}
        }
        @media(max-width:520px){
          .ads-header{align-items:flex-start}
          .ads-header-actions{width:100%}
          .ads-header-actions .admin-btn{flex:1;justify-content:center}
          .ads-analytics{padding:12px}
          .ads-analytics-heading{align-items:flex-start;flex-direction:column}
          .ads-range{width:100%}
          .ads-range select{width:100%}
          .ads-metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
          .ads-chart{height:200px}
          .ads-performance-row{grid-template-columns:minmax(110px,1fr) auto}
          .ads-form-grid{grid-template-columns:1fr}
          .ads-wide,.ads-active{grid-column:auto}
          .ads-card-topline{flex-wrap:wrap}
          .ads-dates{line-height:1.5}
        }
      `}</style>
    </main>
  );
}

export default ManageAds;
