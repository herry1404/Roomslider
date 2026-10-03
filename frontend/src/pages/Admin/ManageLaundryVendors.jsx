import { useEffect, useState } from "react";
import { Shirt, Trash2, Plus, X, Pencil, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { formatLocationAddress, reverseGeocodeLocation } from "../../utils/locationAddress";
import "../../styles/admin/theme.css";

const emptyForm = () => ({
  vendorName: "",
  phone: "",
  whatsapp: "",
  area: "",
  address: "",
  latitude: "",
  longitude: "",
  catalog: [{ name: "", price: "" }],
  isActive: true,
});

function ManageLaundryVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await api.get("/laundry-vendors");
      setVendors(response.data.vendors || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.get("/laundry-vendors")
      .then((response) => {
        if (active) setVendors(response.data.vendors || []);
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || "Failed to load vendors");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEditModal = (vendor) => {
    setEditingId(vendor._id);
    setForm({
      vendorName: vendor.vendorName || "",
      phone: vendor.phone || "",
      whatsapp: vendor.whatsapp || vendor.phone || "",
      area: vendor.area || "",
      address: vendor.address || "",
      latitude: vendor.location?.coordinates?.[1] ?? "",
      longitude: vendor.location?.coordinates?.[0] ?? "",
      catalog: vendor.catalog?.length
        ? vendor.catalog.map((item) => ({ name: item.name, price: item.price }))
        : [{ name: "", price: "" }],
      isActive: vendor.isActive !== false,
    });
    setShowModal(true);
  };

  const updateCatalogItem = (index, key, value) => {
    setForm((current) => ({
      ...current,
      catalog: current.catalog.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const coordinates = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        setForm((current) => ({
          ...current,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        }));
        try {
          const address = await reverseGeocodeLocation(coordinates.latitude, coordinates.longitude);
          setForm((current) => ({
            ...current,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            area: address.area || current.area,
            address: formatLocationAddress(address) || address.formattedAddress || current.address,
          }));
          toast.success(address.postalCode
            ? "Vendor address, PIN code, and coordinates filled."
            : "Vendor address and coordinates filled; add the PIN code manually.");
        } catch {
          toast.error("Coordinates were captured, but the address lookup failed. Enter the address manually.");
        }
      },
      () => toast.error("Could not get location; enter the vendor coordinates")
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const catalog = form.catalog
      .filter((item) => item.name.trim())
      .map((item) => ({ name: item.name.trim(), price: Number(item.price) }));
    if (!catalog.length || catalog.some((item) => !Number.isFinite(item.price) || item.price < 0)) {
      toast.error("Add clothing items with valid prices");
      return;
    }

    try {
      setSaving(true);
      const payload = { ...form, catalog };
      if (editingId) {
        await api.put(`/laundry-vendors/${editingId}`, payload);
        toast.success("Laundry profile updated");
      } else {
        await api.post("/laundry-vendors", payload);
        toast.success("Laundry profile added");
      }
      setShowModal(false);
      await fetchVendors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save laundry profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this laundry profile?")) return;
    try {
      await api.delete(`/laundry-vendors/${id}`);
      toast.success("Laundry profile deleted");
      await fetchVendors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete vendor");
    }
  };

  if (loading) {
    return <div className="admin-page"><p style={{ color: "var(--admin-muted)" }}>Loading vendors...</p></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Laundry Profiles</h1>
          <p>Location-based public listings, WhatsApp details, and each vendor's own price list.</p>
        </div>
        <button className="admin-btn" onClick={openAddModal}><Plus size={18} /> Add Laundry</button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Laundry Profiles</span>
            <div className="admin-stat-icon admin-badge green"><Shirt size={18} /></div>
          </div>
          <div className="admin-stat-value">{vendors.length}</div>
        </div>
      </div>

      <div className="admin-table-wrap">
        {vendors.length === 0 ? (
          <div className="admin-empty"><h3>No laundry profiles yet</h3><p>Add a vendor to show it publicly by location.</p></div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Vendor</th><th>Phone / WhatsApp</th><th>Location</th><th>Catalog</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor._id}>
                  <td><div className="admin-row-thumb"><Shirt size={17} /><span>{vendor.vendorName}</span></div></td>
                  <td style={{ color: "var(--admin-muted)" }}>{vendor.phone}<br />{vendor.whatsapp || vendor.phone}</td>
                  <td style={{ color: "var(--admin-muted)" }}>{[vendor.area, vendor.address].filter(Boolean).join(" · ") || "Location not set"}</td>
                  <td style={{ color: "var(--admin-muted)" }}>{vendor.catalog?.length || 0} items</td>
                  <td><span className={`admin-badge ${vendor.isActive ? "green" : ""}`}>{vendor.isActive ? "Public" : "Hidden"}</span></td>
                  <td>
                    <div className="admin-row-actions" style={{ justifyContent: "flex-end" }}>
                      <button className="admin-icon-btn accent" title="Edit" onClick={() => openEditModal(vendor)}><Pencil size={16} /></button>
                      <button className="admin-icon-btn danger" title="Delete" onClick={() => handleDelete(vendor._id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal-card" onClick={(event) => event.stopPropagation()}>
            <button className="admin-modal-close" type="button" onClick={() => setShowModal(false)}><X size={20} /></button>
            <h2>{editingId ? "Edit Laundry Profile" : "Add Laundry Profile"}</h2>
            <form className="laundry-admin-form" onSubmit={handleSubmit}>
              <input placeholder="Laundry name" required maxLength={100} value={form.vendorName} onChange={(event) => setForm({ ...form, vendorName: event.target.value })} />
              <input placeholder="Phone number" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              <input placeholder="WhatsApp number (blank = phone)" value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} />
              <input placeholder="Area / locality" required value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} />
              <input placeholder="Full address" required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
              <button className="admin-btn secondary" type="button" onClick={useMyLocation}><MapPin size={16} /> Use current location</button>
              <div className="laundry-coordinate-fields">
                <input type="number" step="any" placeholder="Latitude" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} />
                <input type="number" step="any" placeholder="Longitude" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} />
              </div>

              <div className="laundry-catalog-editor">
                <div className="laundry-catalog-title"><strong>Vendor clothing catalog</strong><button type="button" className="admin-btn secondary" onClick={() => setForm({ ...form, catalog: [...form.catalog, { name: "", price: "" }] })}><Plus size={15} /> Add item</button></div>
                {form.catalog.map((item, index) => (
                  <div className="laundry-catalog-row" key={`item-${index}`}>
                    <input placeholder="Clothing item (e.g. Shirt)" required value={item.name} onChange={(event) => updateCatalogItem(index, "name", event.target.value)} />
                    <input type="number" min="0" step="1" placeholder="Price ₹" required value={item.price} onChange={(event) => updateCatalogItem(index, "price", event.target.value)} />
                    <button type="button" aria-label="Remove item" disabled={form.catalog.length === 1} onClick={() => setForm({ ...form, catalog: form.catalog.filter((_, itemIndex) => itemIndex !== index) })}><X size={16} /></button>
                  </div>
                ))}
              </div>

              <label className="laundry-public-toggle"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Show publicly in nearby laundry</label>
              <button type="submit" className="admin-btn" disabled={saving}>{saving ? "Saving..." : editingId ? "Update Profile" : "Add Profile"}</button>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .admin-modal-overlay{position:fixed;inset:0;z-index:999;display:grid;place-items:center;padding:16px;background:#0009}
        .admin-modal-card{position:relative;width:min(100%,580px);max-height:90dvh;overflow:auto;padding:24px;background:var(--admin-card);border:1px solid var(--admin-border);border-radius:16px}
        .admin-modal-close{position:absolute;top:12px;right:12px;background:none;color:var(--admin-muted);border:0;cursor:pointer}
        .laundry-admin-form{display:grid;gap:12px;margin-top:18px}
        .laundry-admin-form>input,.laundry-coordinate-fields input,.laundry-catalog-row input{box-sizing:border-box;width:100%;min-width:0;padding:10px 12px;color:var(--admin-text);background:var(--admin-bg);border:1px solid var(--admin-border);border-radius:10px}
        .laundry-coordinate-fields,.laundry-catalog-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .laundry-catalog-editor{display:grid;gap:10px;padding:12px;border:1px solid var(--admin-border);border-radius:12px}
        .laundry-catalog-title{display:flex;justify-content:space-between;align-items:center;gap:8px}
        .laundry-catalog-row{grid-template-columns:1fr 130px 36px}
        .laundry-catalog-row button{border:1px solid var(--admin-border);border-radius:8px;color:var(--admin-muted);background:transparent}
        .laundry-public-toggle{display:flex;align-items:center;gap:8px;color:var(--admin-muted);font-size:13px}
        @media(max-width:520px){.laundry-catalog-row{grid-template-columns:1fr 1fr 32px}.admin-modal-card{padding:20px 14px}}
      `}</style>
    </div>
  );
}

export default ManageLaundryVendors;
