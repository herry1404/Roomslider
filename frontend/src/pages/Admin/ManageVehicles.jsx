import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import api from "../../api/axios";

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

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>Manage Vehicles</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/admin/vehicles/shops/add" className="publish-btn" style={{ padding: "10px 16px" }}>
            <Plus size={16} style={{ verticalAlign: "-3px" }} /> Add Shop
          </Link>
          <Link to="/admin/vehicles/add" className="publish-btn" style={{ padding: "10px 16px" }}>
            <Plus size={16} style={{ verticalAlign: "-3px" }} /> Add Vehicle
          </Link>
        </div>
      </div>

      {shops.length === 0 ? (
        <p>No vehicle shops yet. Add one to get started.</p>
      ) : (
        shops.map((shop) => (
          <div key={shop._id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 18 }}>
            <h3 style={{ marginBottom: 4 }}>{shop.shopName}</h3>
            <p style={{ color: "#64748b", marginBottom: 12, fontSize: 14 }}>
              {shop.address}, {shop.city} · {shop.contactNumber}
            </p>

            {(vehiclesByShop[shop._id] || []).length === 0 ? (
              <p style={{ fontSize: 14, color: "#94a3b8" }}>No vehicles added for this shop yet</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "6px 8px" }}>Name</th>
                    <th style={{ padding: "6px 8px" }}>Type</th>
                    <th style={{ padding: "6px 8px" }}>Day Price</th>
                    <th style={{ padding: "6px 8px" }}>Available</th>
                    <th style={{ padding: "6px 8px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {vehiclesByShop[shop._id].map((v) => (
                    <tr key={v._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "6px 8px" }}>{v.name}</td>
                      <td style={{ padding: "6px 8px" }}>{v.type}</td>
                      <td style={{ padding: "6px 8px" }}>₹{v.pricePerDay}</td>
                      <td style={{ padding: "6px 8px" }}>{v.available ? "Yes" : "No"}</td>
                      <td style={{ padding: "6px 8px" }}>
                        <button
                          onClick={() => deleteVehicle(v._id)}
                          style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}
                        >
                          Delete
                        </button>
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
