import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Bike, Plus, Trash2, Pencil, Search } from "lucide-react";
import api from "../../api/axios";
import "../../styles/admin/theme.css";
import "../../styles/admin/furniture-admin.css";

const fmt = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function ManageVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/vehicles/admin/all")
      .then(({ data }) => setVehicles(Array.isArray(data) ? data : []))
      .catch((error) => toast.error(error.response?.data?.message || "Vehicles load nahi ho paaye"))
      .finally(() => setLoading(false));
  }, []);

  const updateVehicle = async (vehicle, changes, message) => {
    try {
      if (Object.hasOwn(changes, "isAvailable")) {
        await api.patch(`/vehicles/${vehicle._id}/availability`, changes);
      } else {
        await api.put(`/vehicles/${vehicle._id}`, changes);
      }
      setVehicles((current) => current.map((item) => item._id === vehicle._id ? { ...item, ...changes } : item));
      toast.success(message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Vehicle update nahi hua");
    }
  };

  const removeVehicle = async (vehicle) => {
    if (!window.confirm(`Delete ${vehicle.name}?`)) return;
    try {
      await api.delete(`/vehicles/${vehicle._id}`);
      setVehicles((current) => current.filter((item) => item._id !== vehicle._id));
      toast.success("Vehicle deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Vehicle delete nahi hua");
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vehicles.filter((vehicle) =>
      !query || `${vehicle.brand} ${vehicle.name} ${vehicle.type}`.toLowerCase().includes(query)
    );
  }, [vehicles, search]);

  if (loading) return <div className="admin-page"><p>Loading vehicles...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><h1>Manage Vehicles</h1><p>Manage the vehicle catalog, pricing, visibility and availability.</p></div>
        <Link to="/admin/vehicles/add" className="admin-btn"><Plus size={17} /> Add Vehicle</Link>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card"><div className="admin-stat-top"><span className="admin-stat-label">Total Vehicles</span><div className="admin-stat-icon admin-badge green"><Bike size={18} /></div></div><div className="admin-stat-value">{vehicles.length}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-top"><span className="admin-stat-label">Available</span></div><div className="admin-stat-value">{vehicles.filter((vehicle) => vehicle.isAvailable).length}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-top"><span className="admin-stat-label">Unavailable</span></div><div className="admin-stat-value">{vehicles.filter((vehicle) => !vehicle.isAvailable).length}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-top"><span className="admin-stat-label">Hidden</span></div><div className="admin-stat-value">{vehicles.filter((vehicle) => !vehicle.isVisible).length}</div></div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search"><Search size={16} /><input type="search" placeholder="Search vehicle..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <Link to="/admin/vehicle-requests" className="admin-btn secondary">Vehicle Requests</Link>
      </div>

      <div className="admin-table-wrap">
        {filtered.length === 0 ? <div className="admin-empty"><h3>No vehicles found</h3><p>Add a vehicle or change your search.</p></div> : (
          <table className="admin-table">
            <thead><tr><th>Vehicle</th><th>Type</th><th>Price / day</th><th>Available</th><th>Visible</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map((vehicle) => (
              <tr key={vehicle._id}>
                <td><div className="admin-row-thumb"><div className="fa-thumb">{vehicle.photos?.[0] ? <img src={vehicle.photos[0]} alt="" loading="lazy" /> : <Bike size={18} />}</div><span>{vehicle.brand} {vehicle.name}</span></div></td>
                <td>{vehicle.type}</td>
                <td>{fmt(vehicle.pricePerDay)}</td>
                <td><button type="button" aria-label={`Toggle availability for ${vehicle.name}`} className={`fa-switch ${vehicle.isAvailable ? "on" : ""}`} onClick={() => updateVehicle(vehicle, { isAvailable: !vehicle.isAvailable }, vehicle.isAvailable ? "Marked unavailable" : "Marked available")} /></td>
                <td><button type="button" className={`admin-badge ${vehicle.isVisible ? "green" : "red"}`} onClick={() => updateVehicle(vehicle, { isVisible: !vehicle.isVisible }, vehicle.isVisible ? "Vehicle hidden" : "Vehicle visible")}><span className="admin-badge-dot" />{vehicle.isVisible ? "Visible" : "Hidden"}</button></td>
                <td><div className="admin-row-actions"><Link to={`/admin/vehicles/edit/${vehicle._id}`} className="admin-icon-btn" title="Edit vehicle"><Pencil size={16} /></Link><button type="button" className="admin-icon-btn danger" title="Delete vehicle" onClick={() => removeVehicle(vehicle)}><Trash2 size={16} /></button></div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ManageVehicles;
