import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/admin/theme.css";

const blankSponsor = () => ({ name: "", videoUrl: "", durationSec: 10, active: true });
const blankCoupon = () => ({ kind: "online", sponsorId: "", brand: "", title: "", code: "", link: "", terms: "", expiresAt: "", stock: 100, weight: 1, active: true });

function ManageRewardCatalog() {
  const [catalog, setCatalog] = useState({ sponsors: [], coupons: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sponsorForm, setSponsorForm] = useState(null);
  const [couponForm, setCouponForm] = useState(null);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const load = useCallback(async () => {
    const response = await api.get("/rewards/admin/catalog");
    setCatalog({ sponsors: response.data.sponsors || [], coupons: response.data.coupons || [] });
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      api.get("/rewards/admin/catalog")
        .then((response) => active && setCatalog({ sponsors: response.data.sponsors || [], coupons: response.data.coupons || [] }))
        .catch((error) => active && toast.error(error.response?.data?.message || "Could not load reward catalog."))
        .finally(() => active && setLoading(false));
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  const saveSponsor = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      if (editingSponsor) await api.put(`/rewards/admin/sponsors/${editingSponsor}`, sponsorForm);
      else await api.post("/rewards/admin/sponsors", sponsorForm);
      await load(); setSponsorForm(null); setEditingSponsor(null);
      toast.success("Sponsor saved.");
    } catch (error) { toast.error(error.response?.data?.message || "Could not save sponsor."); } finally { setSaving(false); }
  };

  const saveCoupon = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      if (editingCoupon) await api.put(`/rewards/admin/coupons/${editingCoupon}`, couponForm);
      else await api.post("/rewards/admin/coupons", couponForm);
      await load(); setCouponForm(null); setEditingCoupon(null);
      toast.success("Coupon saved.");
    } catch (error) { toast.error(error.response?.data?.message || "Could not save coupon."); } finally { setSaving(false); }
  };

  if (loading) return <main className="admin-page"><p>Loading reward catalog…</p></main>;
  return <main className="admin-page">
    <header className="admin-analytics-section-heading"><div><span className="admin-analytics-eyebrow">REWARDS</span><h1>Sponsors &amp; Coupons</h1><p>Local sponsor coupons are paid by the sponsor; online coupons never use the cafe budget.</p></div></header>
    <section className="admin-analytics-section">
      <div className="admin-analytics-section-heading"><div><h2>Sponsors</h2><p>Ad views show completed and in-progress local ad sessions.</p></div><button className="admin-primary-btn" onClick={() => { setSponsorForm(blankSponsor()); setEditingSponsor(null); }}><Plus size={16} /> Add sponsor</button></div>
      {sponsorForm && <form className="admin-analytics-card rewards-catalog-form" onSubmit={saveSponsor}><button type="button" className="rewards-catalog-close" onClick={() => setSponsorForm(null)}><X size={17} /></button><label>Name<input required value={sponsorForm.name} onChange={(event) => setSponsorForm({ ...sponsorForm, name: event.target.value })} /></label><label>Video URL (optional)<input value={sponsorForm.videoUrl} onChange={(event) => setSponsorForm({ ...sponsorForm, videoUrl: event.target.value })} /></label><label>Duration seconds<input required type="number" min="10" max="15" value={sponsorForm.durationSec} onChange={(event) => setSponsorForm({ ...sponsorForm, durationSec: Number(event.target.value) })} /></label><label className="rewards-catalog-check"><input type="checkbox" checked={sponsorForm.active} onChange={(event) => setSponsorForm({ ...sponsorForm, active: event.target.checked })} /> Active</label><button className="admin-primary-btn" disabled={saving}>{saving ? "Saving…" : "Save sponsor"}</button></form>}
      <div className="admin-analytics-card admin-analytics-table-wrap"><table className="admin-analytics-table"><thead><tr><th>Sponsor</th><th>Ad duration</th><th>Ad views</th><th>Status</th><th /></tr></thead><tbody>{catalog.sponsors.map((sponsor) => <tr key={sponsor._id}><td>{sponsor.name}</td><td>{sponsor.durationSec}s</td><td>{sponsor.adViews}</td><td>{sponsor.active ? "Active" : "Inactive"}</td><td><button className="admin-icon-btn" onClick={() => { setEditingSponsor(sponsor._id); setSponsorForm({ name: sponsor.name, videoUrl: sponsor.videoUrl || "", durationSec: sponsor.durationSec, active: sponsor.active }); }}><Pencil size={15} /></button></td></tr>)}{!catalog.sponsors.length && <tr><td colSpan="5">No sponsors yet.</td></tr>}</tbody></table></div>
    </section>
    <section className="admin-analytics-section">
      <div className="admin-analytics-section-heading"><div><h2>Coupons</h2><p>Coupon claimed counts are immutable rewards already issued to users.</p></div><button className="admin-primary-btn" onClick={() => { setCouponForm(blankCoupon()); setEditingCoupon(null); }}><Plus size={16} /> Add coupon</button></div>
      {couponForm && <form className="admin-analytics-card rewards-catalog-form" onSubmit={saveCoupon}><button type="button" className="rewards-catalog-close" onClick={() => setCouponForm(null)}><X size={17} /></button><label>Kind<select value={couponForm.kind} onChange={(event) => setCouponForm({ ...couponForm, kind: event.target.value, sponsorId: "" })}><option value="online">Online</option><option value="local">Local sponsor</option></select></label>{couponForm.kind === "local" && <label>Sponsor<select required value={couponForm.sponsorId} onChange={(event) => setCouponForm({ ...couponForm, sponsorId: event.target.value })}><option value="">Choose sponsor</option>{catalog.sponsors.map((sponsor) => <option key={sponsor._id} value={sponsor._id}>{sponsor.name}</option>)}</select></label>}<label>Brand<input required value={couponForm.brand} onChange={(event) => setCouponForm({ ...couponForm, brand: event.target.value })} /></label><label>Title<input required value={couponForm.title} onChange={(event) => setCouponForm({ ...couponForm, title: event.target.value })} /></label><label>Code<input required value={couponForm.code} onChange={(event) => setCouponForm({ ...couponForm, code: event.target.value.toUpperCase() })} /></label><label>Link (optional)<input value={couponForm.link} onChange={(event) => setCouponForm({ ...couponForm, link: event.target.value })} /></label><label>Terms<input value={couponForm.terms} onChange={(event) => setCouponForm({ ...couponForm, terms: event.target.value })} /></label><label>Expiry (optional)<input type="date" value={couponForm.expiresAt} onChange={(event) => setCouponForm({ ...couponForm, expiresAt: event.target.value })} /></label><label>Remaining stock<input required type="number" min="0" value={couponForm.stock} onChange={(event) => setCouponForm({ ...couponForm, stock: Number(event.target.value) })} /></label><label>Weight<input required type="number" min="1" value={couponForm.weight} onChange={(event) => setCouponForm({ ...couponForm, weight: Number(event.target.value) })} /></label><label className="rewards-catalog-check"><input type="checkbox" checked={couponForm.active} onChange={(event) => setCouponForm({ ...couponForm, active: event.target.checked })} /> Active</label><button className="admin-primary-btn" disabled={saving}>{saving ? "Saving…" : "Save coupon"}</button></form>}
      <div className="admin-analytics-card admin-analytics-table-wrap"><table className="admin-analytics-table"><thead><tr><th>Coupon</th><th>Pool</th><th>Stock</th><th>Claimed</th><th>Status</th><th /></tr></thead><tbody>{catalog.coupons.map((coupon) => <tr key={coupon._id}><td>{coupon.brand}<br /><small>{coupon.code} · {coupon.title}</small></td><td>{coupon.kind === "local" ? coupon.sponsorId?.name || "Sponsor removed" : "Online"}</td><td>{coupon.stock}</td><td>{coupon.claimed}</td><td>{coupon.active ? "Active" : "Inactive"}</td><td><button className="admin-icon-btn" onClick={() => { setEditingCoupon(coupon._id); setCouponForm({ ...coupon, sponsorId: coupon.sponsorId?._id || "", expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "" }); }}><Pencil size={15} /></button></td></tr>)}{!catalog.coupons.length && <tr><td colSpan="6">No coupons yet.</td></tr>}</tbody></table></div>
    </section>
  </main>;
}

export default ManageRewardCatalog;
