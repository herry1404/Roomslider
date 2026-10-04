import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/admin/theme.css";
import "../../styles/admin/donations.css";

const CATEGORIES = ["cleaning", "packers", "furniture", "wifi", "appliance-repair", "study-support", "rent-agreement"];
const STATUSES = ["new", "contacted", "confirmed", "completed", "cancelled"];
const DONATION_STATUSES = ["new", "pickup_scheduled", "collected", "cancelled"];
const FURNITURE_CATEGORIES = ["bedroom", "study", "kitchen", "cooling-heating", "laundry-water", "essentials"];
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const addressText = (address = {}) => [address.flatNo, address.building, address.area, address.landmark].filter(Boolean).join(", ");
const donationAddressText = (address = {}) => [address.flat, address.building, address.area, address.landmark].filter(Boolean).join(", ");
const rateUnit = (item = {}) => item.unit || (item.perUnit ? `per ${item.perUnit}` : "");
const title = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function ServiceRequests() {
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [catalogDonation, setCatalogDonation] = useState(null);
  const [catalogCategory, setCatalogCategory] = useState("bedroom");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [savingCatalog, setSavingCatalog] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (category === "donation") {
        const { data } = await api.get("/donations/admin", { params: status ? { status } : {} });
        setRequests(data.requests || []);
      } else {
        const params = {};
        if (status) params.status = status;
        if (category) params.category = category;
        const { data } = await api.get("/service-bookings", { params });
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error(category === "donation" ? "Donation requests could not be loaded" : "Service requests could not be loaded");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [status, category]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((request) => {
      const searchText = category === "donation"
        ? `${request.itemType} ${request.description} ${request.donor?.name} ${request.donor?.phone} ${donationAddressText(request.address)}`
        : `${request.name} ${request.phone} ${request.user?.name} ${request.user?.phone}`;
      return !term || searchText.toLowerCase().includes(term);
    });
  }, [requests, search, category]);

  const setRequestStatus = async (request, value) => {
    try {
      if (category === "donation") {
        await api.put(`/donations/admin/${request._id}/status`, { status: value });
      } else {
        await api.put(`/service-bookings/${request._id}/status`, { status: value });
      }
      setRequests((all) => all.map((item) => item._id === request._id ? { ...item, status: value } : item));
      toast.success(category === "donation" ? "Donation status updated" : "Service status updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Status update failed");
    }
  };

  const addToCatalog = async (event) => {
    event.preventDefault();
    if (!(Number(monthlyRent) > 0)) return toast.error("Enter a monthly rent greater than zero");
    setSavingCatalog(true);
    try {
      await api.post(`/donations/admin/${catalogDonation._id}/catalog`, { category: catalogCategory, monthlyRent: Number(monthlyRent) });
      toast.success("Donated item saved as a hidden furniture draft");
      setCatalogDonation(null);
      setMonthlyRent("");
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Catalog draft could not be created");
    } finally {
      setSavingCatalog(false);
    }
  };

  return <div className="admin-page">
    <div className="admin-page-header"><div><h1>Service Requests</h1><p>Review and update customer requests, including item pickups.</p></div></div>
    <div className="admin-toolbar">
      <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{(category === "donation" ? DONATION_STATUSES : STATUSES).map((item) => <option key={item} value={item}>{title(item)}</option>)}</select>
      <select value={category} onChange={(event) => { setCategory(event.target.value); setStatus(""); }}><option value="">All categories</option>{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}<option value="donation">Donation</option></select>
      <div className="admin-search"><input placeholder={category === "donation" ? "Search donor, item, or area" : "Search name or phone"} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
    </div>
    <div className="admin-table-wrap">{loading ? <div className="admin-empty">Loading requests…</div> : filtered.length === 0 ? <div className="admin-empty"><h3>No requests found</h3></div> : category === "donation" ? <table className="admin-table">
      <thead><tr><th>Request</th><th>Item</th><th>Donor</th><th>Pickup address</th><th>Preferred</th><th>Photos</th><th>Status / actions</th></tr></thead>
      <tbody>{filtered.map((request) => {
        const address = donationAddressText(request.address);
        const location = request.address?.location?.coordinates;
        const mapUrl = location ? `https://www.google.com/maps?q=${location[1]},${location[0]}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ", Indore")}`;
        return <tr key={request._id}>
          <td title={request._id}>{String(request._id).slice(-8)}<br /><small>{new Date(request.createdAt).toLocaleDateString("en-IN")}</small></td>
          <td>{title(request.itemType)} · {request.quantity}<br /><small>{title(request.condition)}</small><br />{request.description}</td>
          <td>{request.donor?.name || "—"}<br /><a href={`tel:${request.donor?.phone || ""}`}>{request.donor?.phone || "No phone on account"}</a></td>
          <td>{address || "—"}<br /><a href={mapUrl} target="_blank" rel="noreferrer">Open in Maps</a></td>
          <td>{new Date(request.preferredDate).toLocaleDateString("en-IN")}<br />{title(request.preferredTimeSlot)}</td>
          <td>{request.photos?.map((photo, index) => <a key={photo} href={photo} target="_blank" rel="noreferrer">Photo {index + 1}<br /></a>) || "—"}</td>
          <td><select aria-label="Donation status" value={request.status} disabled={["listed", "cancelled"].includes(request.status)} onChange={(event) => setRequestStatus(request, event.target.value)}>{DONATION_STATUSES.map((item) => <option key={item} value={item}>{title(item)}</option>)}</select>
            {["new", "pickup_scheduled"].includes(request.status) && <button className="admin-btn" style={{ marginTop: 7 }} onClick={() => setRequestStatus(request, "collected")}>Mark collected</button>}
            {request.status === "collected" && !request.catalogItem && <button className="admin-btn" style={{ marginTop: 7 }} onClick={() => { setCatalogDonation(request); setCatalogCategory("bedroom"); setMonthlyRent(""); }}>Add to Furniture catalog as Donated</button>}
            {request.catalogItem?.name && <div style={{ marginTop: 6 }}><a href="/admin/furniture">{request.catalogItem.name}</a></div>}
          </td>
        </tr>;
      })}</tbody>
    </table> : <table className="admin-table">
      <thead><tr><th>Request</th><th>Date</th><th>User</th><th>Category</th><th>Items / total</th><th>Address</th><th>Preferred</th><th>Status</th></tr></thead>
      <tbody>{filtered.map((request) => {
        const address = addressText(request.address);
        const mapUrl = request.address?.lat != null && request.address?.lng != null ? `https://www.google.com/maps?q=${request.address.lat},${request.address.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ", Indore")}`;
        return <tr key={request._id}>
          <td title={request._id}>{String(request._id).slice(-8)}</td>
          <td>{new Date(request.createdAt).toLocaleDateString("en-IN")}</td>
          <td>{request.name || request.user?.name}<br /><a href={`tel:${request.phone || request.user?.phone}`}>{request.phone || request.user?.phone}</a></td>
          <td>{request.category}</td>
          <td>{request.selectedItems?.map((item) => <div key={`${item.name}-${item.type}`}>{item.name} · {item.quantity || 1} × {money(item.price)}{rateUnit(item) ? ` / ${rateUnit(item).replace(/^per\s+/i, "")}` : ""} = {money(item.lineTotal || Number(item.price || 0) * Number(item.quantity || 1))}</div>)}<strong>Total: {money(request.totalEstimate)}</strong>
            {request.category === "rent-agreement" && <div><div>Owner: {request.extra?.ownerName || "—"}; Tenant: {request.extra?.tenantName || "—"}</div><div>Rent: {money(request.extra?.monthlyRent)} · Deposit: {money(request.extra?.deposit)}</div><div>Start: {request.extra?.startDate || "—"}</div>{request.idPhotoUrl && <a href={request.idPhotoUrl} target="_blank" rel="noreferrer">View ID photo</a>}</div>}
          </td>
          <td>{address || "—"}<br /><a href={mapUrl} target="_blank" rel="noreferrer">Open in Maps</a></td>
          <td>{request.startDate && <>Start: {new Date(request.startDate).toLocaleDateString("en-IN")}<br /></>}{request.preferredDate ? <>Visit: {new Date(request.preferredDate).toLocaleDateString("en-IN")}<br />{request.preferredTimeSlot || "—"}</> : !request.startDate && "—"}</td>
          <td><select aria-label="Request status" value={request.status} onChange={(event) => setRequestStatus(request, event.target.value)}>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select></td>
        </tr>;
      })}</tbody>
    </table>}</div>
    {catalogDonation && <div className="donation-admin-overlay" onClick={() => setCatalogDonation(null)}><form className="donation-admin-modal" onSubmit={addToCatalog} onClick={(event) => event.stopPropagation()}>
      <h2>Add as donated furniture</h2><p>Creates an unpublished furniture item draft. Donor details and pickup address are not copied to the catalog.</p>
      <label>Furniture category<select value={catalogCategory} onChange={(event) => setCatalogCategory(event.target.value)}>{FURNITURE_CATEGORIES.map((item) => <option key={item} value={item}>{title(item)}</option>)}</select></label>
      <label>Monthly rent (₹)<input type="number" min="1" required value={monthlyRent} onChange={(event) => setMonthlyRent(event.target.value)} /></label>
      <div className="fa-actions"><button className="admin-btn" disabled={savingCatalog}>{savingCatalog ? "Saving…" : "Create catalog draft"}</button><button type="button" className="admin-btn secondary" onClick={() => setCatalogDonation(null)}>Cancel</button></div>
    </form></div>}
  </div>;
}

export default ServiceRequests;
