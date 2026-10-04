import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import api from "../../api/axios";
import "../../styles/admin/theme.css";
import "../../styles/admin/furniture-admin.css";

const CATS = [
  { value: "bedroom", label: "Bedroom" },
  { value: "study", label: "Study" },
  { value: "kitchen", label: "Kitchen" },
  { value: "cooling-heating", label: "Cooling & Heating" },
  { value: "laundry-water", label: "Laundry & Water" },
  { value: "essentials", label: "Essentials" },
];

const empty = {
  name: "", category: "bedroom", description: "", badge: "",
  deposit: "", deliveryFee: "", r3: "", r6: "", r12: "",
  buyPrice: "", secondHandPrice: "", isAvailable: true, isActive: true,
};

function AddFurniture() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [f, setF] = useState(empty);
  const [oldImages, setOldImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return;
    api
      .get(`/furniture/admin/${id}`)
      .then((res) => {
        const i = res.data;
        const plan = (m) => {
          const p = (i.rentPlans || []).find((x) => x.months === m);
          return p ? String(p.monthlyRent) : "";
        };
        setF({
          name: i.name || "", category: i.category || "bedroom",
          description: i.description || "", badge: i.badge || "",
          deposit: i.deposit ? String(i.deposit) : "",
          deliveryFee: i.deliveryFee ? String(i.deliveryFee) : "",
          r3: plan(3), r6: plan(6), r12: plan(12),
          buyPrice: i.buyPrice ? String(i.buyPrice) : "",
          secondHandPrice: i.secondHandPrice ? String(i.secondHandPrice) : "",
          isAvailable: i.isAvailable !== false, isActive: i.isActive !== false,
        });
        setOldImages(i.images || []);
      })
      .catch(() => toast.error("Item load nahi hua"))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const set = (k) => (e) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast.error("Name required");

    const rentPlans = [[3, f.r3], [6, f.r6], [12, f.r12]]
      .filter(([, v]) => Number(v) > 0)
      .map(([m, v]) => ({ months: m, monthlyRent: Number(v) }));
    if (rentPlans.length === 0 && !(Number(f.buyPrice) > 0)) {
      return toast.error("Add at least one rent price or a buy price");
    }

    const fd = new FormData();
    fd.append("name", f.name.trim());
    fd.append("category", f.category);
    fd.append("description", f.description);
    fd.append("badge", f.badge);
    fd.append("deposit", f.deposit || 0);
    fd.append("deliveryFee", f.deliveryFee || 0);
    fd.append("buyPrice", f.buyPrice);
    fd.append("secondHandPrice", f.secondHandPrice);
    fd.append("rentPlans", JSON.stringify(rentPlans));
    fd.append("isAvailable", f.isAvailable);
    fd.append("isActive", f.isActive);
    if (editing) fd.append("existingImages", JSON.stringify(oldImages));
    files.forEach((file) => fd.append("images", file));

    setSaving(true);
    try {
      if (editing) await api.put(`/furniture/${id}`, fd);
      else await api.post("/furniture", fd);
      toast.success(editing ? "Item updated" : "Item added");
      navigate("/admin/furniture");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <p style={{ color: "var(--admin-muted)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>{editing ? "Edit Item" : "Add Item"}</h1>
          <p>Leave rent prices blank for buy-only items, or buy price blank for rent-only items.</p>
        </div>
        <Link to="/admin/furniture" className="admin-btn secondary">
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      <form className="fa-form" onSubmit={submit}>
        <div className="fa-grid">
          <div className="fa-field">
            <label>Name *</label>
            <input value={f.name} onChange={set("name")} placeholder="Single Bed" />
          </div>
          <div className="fa-field">
            <label>Category *</label>
            <select value={f.category} onChange={set("category")}>
              {CATS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="fa-field">
            <label>Badge (optional)</label>
            <input value={f.badge} onChange={set("badge")} placeholder="Popular / Student pick" />
          </div>
        </div>

        <div className="fa-field">
          <label>Description</label>
          <textarea rows={3} value={f.description} onChange={set("description")} />
        </div>

        <div className="fa-section">Rent (monthly price per tenure)</div>
        <div className="fa-grid">
          <div className="fa-field"><label>3 months</label><input type="number" min="0" value={f.r3} onChange={set("r3")} /></div>
          <div className="fa-field"><label>6 months</label><input type="number" min="0" value={f.r6} onChange={set("r6")} /></div>
          <div className="fa-field"><label>12 months</label><input type="number" min="0" value={f.r12} onChange={set("r12")} /></div>
          <div className="fa-field"><label>Security deposit</label><input type="number" min="0" value={f.deposit} onChange={set("deposit")} /></div>
          <div className="fa-field"><label>Delivery fee</label><input type="number" min="0" value={f.deliveryFee} onChange={set("deliveryFee")} /></div>
        </div>

        <div className="fa-section">Buy</div>
        <div className="fa-grid">
          <div className="fa-field"><label>Buy price (new)</label><input type="number" min="0" value={f.buyPrice} onChange={set("buyPrice")} /></div>
          <div className="fa-field"><label>Second-hand price</label><input type="number" min="0" value={f.secondHandPrice} onChange={set("secondHandPrice")} /></div>
        </div>

        <div className="fa-section">Photos</div>
        {oldImages.length > 0 && (
          <div className="fa-imgs">
            {oldImages.map((src) => (
              <div className="fa-img" key={src}>
                <img src={optimizeCloudinaryImage(src, 640)} alt="" loading="lazy" />
                <button type="button" aria-label={`Remove ${src}`} onClick={() => setOldImages((current) => current.filter((image) => image !== src))}>×</button>
              </div>
            ))}
          </div>
        )}
        <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files))} style={{ color: "var(--admin-muted)" }} />
        {files.length > 0 && <p className="fa-hint">{files.length} new photo(s) selected</p>}

        <div className="fa-checks">
          <label><input type="checkbox" checked={f.isAvailable} onChange={set("isAvailable")} /> Available (uncheck = Out of stock)</label>
          <label><input type="checkbox" checked={f.isActive} onChange={set("isActive")} /> Visible on site</label>
        </div>

        <div className="fa-actions">
          <button type="submit" className="admin-btn" disabled={saving}>
            {saving ? "Saving..." : editing ? "Update Item" : "Add Item"}
          </button>
          <Link to="/admin/furniture" className="admin-btn secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

export default AddFurniture;
