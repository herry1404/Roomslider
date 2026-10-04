import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/admin/theme.css";

const CATEGORIES = ["cleaning", "packers", "furniture", "wifi", "appliance-repair", "study-support", "rent-agreement"];
const STATUSES = ["new", "contacted", "confirmed", "completed", "cancelled"];
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const addressText = (address = {}) => [address.flatNo, address.building, address.area, address.landmark].filter(Boolean).join(", ");
const rateUnit = (item = {}) => item.unit || (item.perUnit ? `per ${item.perUnit}` : "");

function ServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (category) params.category = category;
      const { data } = await api.get("/service-bookings", { params });
      setRequests(Array.isArray(data) ? data : []);
    } catch { toast.error("Service requests could not be loaded"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [status, category]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((request) => !term || `${request.name} ${request.phone} ${request.user?.name} ${request.user?.phone}`.toLowerCase().includes(term));
  }, [requests, search]);

  const setRequestStatus = async (id, value) => {
    try { await api.put(`/service-bookings/${id}/status`, { status: value }); setRequests((all) => all.map((request) => request._id === id ? { ...request, status: value } : request)); }
    catch { toast.error("Status update failed"); }
  };

  return <div className="admin-page">
    <div className="admin-page-header"><div><h1>Service Requests</h1><p>Review and update customer service requests.</p></div></div>
    <div className="admin-toolbar">
      <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
      <select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <div className="admin-search"><input placeholder="Search name or phone" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
    </div>
    <div className="admin-table-wrap">{loading ? <div className="admin-empty">Loading requests…</div> : filtered.length === 0 ? <div className="admin-empty"><h3>No requests found</h3></div> : <table className="admin-table">
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
          <td><select aria-label="Request status" value={request.status} onChange={(e) => setRequestStatus(request._id, e.target.value)}>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select></td>
        </tr>;
      })}</tbody>
    </table>}</div>
  </div>;
}

export default ServiceRequests;
