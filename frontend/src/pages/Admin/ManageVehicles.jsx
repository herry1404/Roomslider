import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Trash2, Bike, Store, MapPin } from "lucide-react";
import api from "../../api/axios";
import "../../styles/admin/theme.css";

function ManageVehicles() {
  const [shops, setShops] = useState([]);
  const [vehiclesByShop, setVehiclesByShop] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/vehicle-shops");
      const shopList = Array.isArray(res.data) ? res.data : res.data?.shops || [];
      setShops(shopList);

      const entries = await Promise.all(
        shopList.map(async (s) => {
          try {
            const r = await api.get(`/vehicles/shop/${s._id}`);
            return [s._id, Array.isArray(r.data) ? r.data : []];
          } catch {
            return [s._id, []];
          }
        })
      );
      setVehiclesByShop(Object.fromEntries(entries));
    } catch (error) {
      toast.error("Shops load nahi ho paayi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const deleteVehicle = async (id) => {
    if (!window.confirm("Delete this vehicle?")) return;
    try {
      await api.delete(`/vehicles/${id}`);
      toast.success("Vehicle deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  const totalVehicles = Object.values(vehiclesByShop).reduce((sum, v) => sum + v.length, 0);
  const availableVehicles = Object.values(vehiclesByShop)
    .flat()
    .filter((v) => v.available).length;

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
          <h1>Manage Vehicles</h1>
          <p>Vehicle rental shops and their listed vehicles.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/admin/vehicles/shops/add" className="admin-btn secondary">
            <Plus size={16} /> Add Shop
          </Link>
          <Link to="/admin/vehicles/add" className="admin-btn">
            <Plus size={16} /> Add Vehicle
          </Link>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total Shops</span>
            <div className="admin-stat-icon admin-badge green">
              <Store size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{shops.length}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total Vehicles</span>
            <div className="admin-stat-icon admin-badge blue">
              <Bike size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{totalVehicles}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Available Now</span>
            <div className="admin-stat-icon admin-badge green">
              <Bike size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{availableVehicles}</div>
        </div>
      </div>

      {shops.length === 0 ? (
        <div className="admin-table-wrap">
          <div className="admin-empty">
            <h3>No vehicle shops yet</h3>
            <p>Add one to get started.</p>
          </div>
        </div>
      ) : (
        shops.map((shop) => (
          <div key={shop._id} className="admin-table-wrap" style={{ marginBottom: 18 }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--admin-border)" }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>{shop.shopName}</h3>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 13,
                  color: "var(--admin-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <MapPin size={13} /> {shop.address}, {shop.city} · {shop.contactNumber}
              </p>
            </div>

            {(vehiclesByShop[shop._id] || []).length === 0 ? (
              <div className="admin-empty" style={{ padding: "24px" }}>
                <p style={{ margin: 0 }}>No vehicles added for this shop yet</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Day Price</th>
                    <th>Available</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiclesByShop[shop._id].map((v) => (
                    <tr key={v._id}>
                      <td style={{ fontWeight: 600 }}>{v.name}</td>
                      <td style={{ color: "var(--admin-muted)" }}>{v.type}</td>
                      <td style={{ fontWeight: 700 }}>₹{v.pricePerDay}</td>
                      <td>
                        <span className={`admin-badge ${v.available ? "green" : "red"}`}>
                          <span className="admin-badge-dot" />
                          {v.available ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions" style={{ justifyContent: "flex-end" }}>
                          <button
                            className="admin-icon-btn danger"
                            title="Delete"
                            onClick={() => deleteVehicle(v._id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default ManageVehicles;
