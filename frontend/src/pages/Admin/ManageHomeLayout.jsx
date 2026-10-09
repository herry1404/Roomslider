import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import api from "../../api/axios";
import confirmAction from "../../utils/confirmAction";
import { DEFAULT_HOME_TILES } from "../../utils/homeExploreTiles";
import "../../styles/admin/theme.css";

const TYPE_LABEL = {
  hero: "Hero",
  categories: "Categories",
  explore: "Everything you need away from home",
  listings: "Listings",
  banner: "Banner",
  hourlyRooms: "Hourly / Short Stay",
  villas: "Villas",
};
const CUSTOM = ["listings", "banner"];
const CATEGORIES = ["", "Room", "PG", "Hostel", "Flat"];

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid var(--admin-border, #374151)",
  background: "transparent",
  color: "inherit",
  fontSize: 14,
};
const labelStyle = { fontSize: 12, color: "var(--admin-muted)", marginBottom: 4, display: "block" };

const emptyForm = (type = "listings") => ({
  id: null,
  type,
  title: "",
  category: "",
  area: "",
  college: "",
  limit: 10,
  viewAllPath: "",
  imageUrl: "",
  text: "",
  buttonText: "",
  linkUrl: "",
  tiles: [],
});

const detailsFor = (s) => {
  const c = s.config || {};
  if (s.type === "listings") {
    const parts = [c.category || "All categories"];
    if (c.area) parts.push(`Area: ${c.area}`);
    if (c.college) parts.push(`Near: ${c.college}`);
    parts.push(`${c.limit || 10} cards`);
    return parts.join(" · ");
  }
  if (s.type === "banner") {
    if (c.text) return c.text.slice(0, 50);
    return c.imageUrl ? "Image banner" : "Empty banner";
  }
  if (s.type === "explore") {
    const tileCount = Array.isArray(c.tiles) && c.tiles.length ? c.tiles.length : DEFAULT_HOME_TILES.length;
    return `${tileCount} editable home tiles`;
  }
  return "Built-in section";
};

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function ManageHomeLayout() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/home-sections/admin/all");
      setSections(res.data?.sections || []);
    } catch {
      toast.error("Layout load nahi ho paya");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(load);
  }, []);

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    try {
      await api.put("/home-sections/reorder", { ids: next.map((s) => s._id) });
    } catch {
      toast.error("Order save nahi hua");
      load();
    }
  };

  const toggle = async (s) => {
    try {
      await api.put(`/home-sections/${s._id}`, { enabled: !s.enabled });
      setSections((prev) =>
        prev.map((x) => (x._id === s._id ? { ...x, enabled: !x.enabled } : x))
      );
    } catch {
      toast.error("Update nahi hua");
    }
  };

  const remove = async (s) => {
    if (!await confirmAction(`"${s.title || TYPE_LABEL[s.type]}" delete karein?`, { confirmText: "Delete" })) return;
    try {
      await api.delete(`/home-sections/${s._id}`);
      toast.success("Section delete ho gaya");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete nahi hua");
    }
  };

  const openEdit = (s) => {
    const c = s.config || {};
    setForm({
      id: s._id,
      type: s.type,
      title: s.type === "explore" && s.title === "Explore"
        ? "Everything you need away from home"
        : s.title || "",
      category: c.category || "",
      area: c.area || "",
      college: c.college || "",
      limit: c.limit || 10,
      viewAllPath: c.viewAllPath || "",
      imageUrl: c.imageUrl || "",
      text: c.text || "",
      buttonText: c.buttonText || "",
      linkUrl: c.linkUrl || "",
      tiles: s.type === "explore"
        ? (Array.isArray(c.tiles) && c.tiles.length ? c.tiles : DEFAULT_HOME_TILES).map((tile) => ({ ...tile }))
        : [],
    });
  };

  const buildConfig = (f) =>
    f.type === "explore"
      ? { tiles: f.tiles }
      : f.type === "listings"
      ? {
          category: f.category,
          area: f.area,
          college: f.college,
          limit: Number(f.limit) || 10,
          viewAllPath: f.viewAllPath,
        }
      : {
          imageUrl: f.imageUrl,
          text: f.text,
          buttonText: f.buttonText,
          linkUrl: f.linkUrl,
        };

  const save = async () => {
    if (form.type === "listings" && !form.title.trim()) {
      toast.error("Title likho");
      return;
    }
    if (form.type === "banner" && !form.imageUrl.trim() && !form.text.trim()) {
      toast.error("Image link ya text me se kuch daalo");
      return;
    }
    if (form.type === "explore" && form.tiles.some((tile) =>
      !tile.title.trim() || (tile.action !== "loan" && (!tile.to.startsWith("/") || tile.to.startsWith("//")))
    )) {
      toast.error("Har tile ko title dein aur valid site path set karein");
      return;
    }
    setSaving(true);
    try {
      const body = { title: form.title, config: buildConfig(form) };
      if (form.id) {
        await api.put(`/home-sections/${form.id}`, body);
      } else {
        await api.post("/home-sections", { type: form.type, ...body });
      }
      toast.success("Save ho gaya");
      setForm(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Save nahi hua");
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const updateTile = (index, key, value) => {
    setForm((current) => ({
      ...current,
      tiles: current.tiles.map((tile, tileIndex) =>
        tileIndex === index ? { ...tile, [key]: value } : tile
      ),
    }));
  };
  const moveTile = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= form.tiles.length) return;
    setForm((current) => {
      const tiles = [...current.tiles];
      [tiles[index], tiles[target]] = [tiles[target], tiles[index]];
      return { ...current, tiles };
    });
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
          <h1>Home Layout</h1>
          <p>Homepage sections manage karein aur “Everything you need away from home” tiles edit karein.</p>
        </div>
        <div className="admin-toolbar" style={{ margin: 0 }}>
          <button className="admin-btn" onClick={() => setForm(emptyForm("listings"))}>
            <Plus size={18} /> Listings section
          </button>
          <button className="admin-btn secondary" onClick={() => setForm(emptyForm("banner"))}>
            <Plus size={18} /> Banner
          </button>
        </div>
      </div>

      {form && (
        <div
          className="admin-table-wrap"
          style={{ padding: 16, marginBottom: 16, display: "grid", gap: 12 }}
        >
          <h3 style={{ margin: 0 }}>
            {form.id ? "Edit" : "New"} {TYPE_LABEL[form.type]} section
          </h3>

          <Field label="Title">
            <input style={inputStyle} value={form.title} onChange={set("title")} placeholder="jaise: PG near IPS Academy" />
          </Field>

          {form.type === "listings" && (
            <>
              <Field label="Category (khaali = sab)">
                <select style={inputStyle} value={form.category} onChange={set("category")}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c || "All"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Area (location me ye naam ho, khaali = sab)">
                <input style={inputStyle} value={form.area} onChange={set("area")} placeholder="jaise: Vijay Nagar" />
              </Field>
              <Field label="College (nearby me ye naam ho, khaali = sab)">
                <input style={inputStyle} value={form.college} onChange={set("college")} placeholder="jaise: IPS Academy" />
              </Field>
              <Field label="Kitne cards (1 se 24)">
                <input style={inputStyle} type="number" min="1" max="24" value={form.limit} onChange={set("limit")} />
              </Field>
              <Field label="View All ka path (/ se shuru, jaise /pg)">
                <input style={inputStyle} value={form.viewAllPath} onChange={set("viewAllPath")} placeholder="/pg" />
              </Field>
            </>
          )}

          {form.type === "banner" && (
            <>
              <Field label="Image link (https://...)">
                <input style={inputStyle} value={form.imageUrl} onChange={set("imageUrl")} />
              </Field>
              <Field label="Text">
                <input style={inputStyle} value={form.text} onChange={set("text")} />
              </Field>
              <Field label="Button ka text">
                <input style={inputStyle} value={form.buttonText} onChange={set("buttonText")} />
              </Field>
              <Field label="Button ka link (/pg ya https://...)">
                <input style={inputStyle} value={form.linkUrl} onChange={set("linkUrl")} />
              </Field>
            </>
          )}

          {form.type === "explore" && (
            <div style={{ display: "grid", gap: 12 }}>
              <p style={{ margin: 0, color: "var(--admin-muted)", fontSize: 13 }}>
                Edit, add, remove, and reorder the homepage feature tiles. Use a site path such as /villas.
              </p>
              {form.tiles.map((tile, index) => (
                <div
                  key={`${index}-${tile.title}`}
                  className="admin-table-wrap"
                  style={{ display: "grid", gap: 10, padding: 12 }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <strong>Tile {index + 1}</strong>
                    <span className="admin-row-actions">
                      <button className="admin-icon-btn" type="button" onClick={() => moveTile(index, -1)} disabled={index === 0} aria-label={`Move tile ${index + 1} up`}>
                        <ArrowUp size={16} />
                      </button>
                      <button className="admin-icon-btn" type="button" onClick={() => moveTile(index, 1)} disabled={index === form.tiles.length - 1} aria-label={`Move tile ${index + 1} down`}>
                        <ArrowDown size={16} />
                      </button>
                    </span>
                  </div>
                  <Field label="Title">
                    <input style={inputStyle} maxLength="60" value={tile.title} onChange={(event) => updateTile(index, "title", event.target.value)} />
                  </Field>
                  <Field label="Description">
                    <input style={inputStyle} maxLength="120" value={tile.desc} onChange={(event) => updateTile(index, "desc", event.target.value)} />
                  </Field>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                    <Field label="Icon">
                      <select style={inputStyle} value={tile.icon} onChange={(event) => updateTile(index, "icon", event.target.value)}>
                        {["BedDouble", "Users", "HeartHandshake", "PackageOpen", "HeartPulse", "Castle", "Banknote", "Bike", "UtensilsCrossed", "Shirt", "Sparkles", "Truck", "Sofa", "Wifi", "Wrench", "BookOpen", "FileText", "LayoutGrid"].map((icon) => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Button label">
                      <input style={inputStyle} maxLength="24" value={tile.pill} onChange={(event) => updateTile(index, "pill", event.target.value)} />
                    </Field>
                    <Field label="Tile action">
                      <select style={inputStyle} value={tile.action === "loan" ? "loan" : "link"} onChange={(event) => updateTile(index, "action", event.target.value)}>
                        <option value="link">Open page</option>
                        <option value="loan">Open student loan form</option>
                      </select>
                    </Field>
                  </div>
                  {tile.action !== "loan" && (
                    <Field label="Destination path">
                      <input style={inputStyle} maxLength="200" value={tile.to} onChange={(event) => updateTile(index, "to", event.target.value)} placeholder="/villas" />
                    </Field>
                  )}
                  <button
                    className="admin-btn secondary"
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, tiles: current.tiles.filter((_, tileIndex) => tileIndex !== index) }))}
                  >
                    <Trash2 size={16} /> Remove tile
                  </button>
                </div>
              ))}
              {form.tiles.length < 24 && (
                <button
                  className="admin-btn secondary"
                  type="button"
                  onClick={() => setForm((current) => ({
                    ...current,
                    tiles: [...current.tiles, { icon: "LayoutGrid", title: "", desc: "", pill: "Explore", action: "link", to: "" }],
                  }))}
                >
                  <Plus size={16} /> Add tile
                </button>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button className="admin-btn" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button className="admin-btn secondary" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        {sections.length === 0 ? (
          <div className="admin-empty">
            <h3>Koi section nahi</h3>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Section</th>
                <th>Type</th>
                <th>Details</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((s, i) => (
                <tr key={s._id} style={{ opacity: s.enabled ? 1 : 0.5 }}>
                  <td>
                    <div className="admin-row-actions">
                      <button className="admin-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} title="Upar">
                        <ArrowUp size={16} />
                      </button>
                      <button className="admin-icon-btn" onClick={() => move(i, 1)} disabled={i === sections.length - 1} title="Neeche">
                        <ArrowDown size={16} />
                      </button>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.title || TYPE_LABEL[s.type]}</td>
                  <td>
                    <span className="admin-badge">{TYPE_LABEL[s.type]}</span>
                  </td>
                  <td style={{ color: "var(--admin-muted)" }}>{detailsFor(s)}</td>
                  <td>
                    <span className={`admin-badge ${s.enabled ? "green" : ""}`}>
                      {s.enabled ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions" style={{ justifyContent: "flex-end" }}>
                      <button className="admin-icon-btn" onClick={() => toggle(s)} title={s.enabled ? "Hide" : "Show"}>
                        {s.enabled ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      {(CUSTOM.includes(s.type) || s.type === "explore") && (
                        <button className="admin-icon-btn" onClick={() => openEdit(s)} title="Edit">
                          <Pencil size={16} />
                        </button>
                      )}
                      {CUSTOM.includes(s.type) && (
                        <>
                          <button className="admin-icon-btn" onClick={() => remove(s)} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ManageHomeLayout;
