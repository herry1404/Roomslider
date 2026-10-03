import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList, MapPin, MessageCircle, Phone } from "lucide-react";
import api from "../../api/axios";
import "../../styles/admin/theme.css";
import "../../styles/admin/furniture-admin.css";
import "../../styles/vehicles.css";

const STATUSES = ["new", "confirmed", "picked_up", "returned", "cancelled"];
const formatPrice = (price) => `₹${Number(price || 0).toLocaleString("en-IN")}`;
const formatDate = (date) => new Date(date).toLocaleString("en-IN");
const whatsappLink = (phone) => `https://wa.me/91${String(phone || "").replace(/\D/g, "").slice(-10)}`;

function ManageVehicleRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/vehicle-requests")
      .then(({ data }) => setRequests(Array.isArray(data) ? data : []))
      .catch((error) => toast.error(error.response?.data?.message || "Vehicle requests load nahi hue"))
      .finally(() => setLoading(false));
  }, []);

  const setStatus = async (request, status) => {
    try {
      await api.put(`/vehicle-requests/${request._id}/status`, { status });
      setRequests((current) => current.map((item) => item._id === request._id ? { ...item, status } : item));
      toast.success("Request status updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Status update nahi hua");
    }
  };

  const count = (status) => status === "all" ? requests.length : requests.filter((request) => request.status === status).length;
  const shown = filter === "all" ? requests : requests.filter((request) => request.status === filter);
  if (loading) return <div className="admin-page"><p>Loading requests...</p></div>;

  return (
    <div className="admin-page vehicle-admin-page">
      <div className="admin-page-header"><div><h1>Vehicle Requests</h1><p>Rental requests sent from the vehicle catalog.</p></div></div>
      <div className="admin-stats-grid">
        {["all", "new", "confirmed", "picked_up"].map((status) => (
          <div className="admin-stat-card" key={status}><div className="admin-stat-top"><span className="admin-stat-label">{status === "all" ? "Total Requests" : status.replace("_", " ")}</span><div className="admin-stat-icon admin-badge green">{status === "all" && <ClipboardList size={18} />}</div></div><div className="admin-stat-value">{count(status)}</div></div>
        ))}
      </div>
      <div className="admin-toolbar">{["all", ...STATUSES].map((status) => <button type="button" key={status} className={`admin-btn ${filter === status ? "" : "secondary"}`} onClick={() => setFilter(status)}>{status.replace("_", " ")} ({count(status)})</button>)}</div>
      <div className="admin-table-wrap">
        {shown.length === 0 ? <div className="admin-empty"><h3>No vehicle requests</h3><p>New rental requests will appear here.</p></div> : (
          <table className="admin-table">
            <thead><tr><th>Vehicle & dates</th><th>Customer</th><th>Pickup & address</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>{shown.map((request) => {
              const address = request.address || {};
              const mapUrl = request.location?.lat != null && request.location?.lng != null
                ? `https://www.google.com/maps?q=${request.location.lat},${request.location.lng}` : "";
              return <tr key={request._id}>
                <td><strong>{request.vehicle ? `${request.vehicle.brand} ${request.vehicle.name}` : "Vehicle removed"}</strong><div>{formatDate(request.pickupDate)} – {formatDate(request.returnDate)}</div><div>{request.durationType}</div></td>
                <td><strong>{request.name}</strong><div>{request.phone}</div><div className="admin-row-actions"><a className="admin-icon-btn" href={`tel:${request.phone}`} title="Call"><Phone size={15} /></a><a className="admin-icon-btn" href={whatsappLink(request.phone)} target="_blank" rel="noreferrer" title="WhatsApp"><MessageCircle size={15} /></a></div></td>
                <td>
                  <div>{request.pickupOption}</div>
                  <div>
                    {[
                      address.house,
                      address.building,
                      address.area,
                      address.landmark ? `Near ${address.landmark}` : "",
                      address.city,
                      address.state,
                      address.postalCode,
                    ].filter(Boolean).join(", ")}
                  </div>
                  {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer"><MapPin size={13} /> Open map</a>}
                </td>
                <td><strong>{formatPrice(request.totalPrice)}</strong></td>
                <td><select className="admin-btn secondary" value={request.status} onChange={(event) => setStatus(request, event.target.value)}>{STATUSES.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}</select></td>
              </tr>;
            })}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ManageVehicleRequests;
