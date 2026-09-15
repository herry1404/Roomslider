import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Utensils, Plus, Trash2, LogOut, ClipboardList } from "lucide-react";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

import "../../styles/mess/dashboard.css";

function MessOwnerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mess, setMess] = useState(null);
  const [todayOrderCount, setTodayOrderCount] = useState(0);
  const [menuItems, setMenuItems] = useState([""]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/mess/me");
      setMess(res.data.mess);
      setTodayOrderCount(res.data.todayOrderCount || 0);

      const items = res.data.mess?.todayMenu?.items || [];
      setMenuItems(items.length ? items.map((i) => i.name) : [""]);

      const ordersRes = await api.get("/mess/me/orders/today");
      setOrders(ordersRes.data.orders || []);
    } catch (error) {
      console.error("MESS DASHBOARD ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleItemChange = (index, value) => {
    setMenuItems((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addItemField = () => {
    setMenuItems((prev) => [...prev, ""]);
  };

  const removeItemField = (index) => {
    setMenuItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveMenu = async () => {
    const cleanItems = menuItems
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    try {
      setSaving(true);
      const res = await api.put("/mess/me/menu", { items: cleanItems });
      setMess(res.data.mess);
      toast.success("Today's menu updated");
    } catch (error) {
      console.error("MENU UPDATE ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to update menu");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/mess/login");
  };

  if (loading) {
    return (
      <div className="mess-dashboard">
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="mess-dashboard">
      <div className="mess-dashboard-top">
        <div>
          <h2>Mess Owner Dashboard</h2>
          <p>Welcome back, {mess?.name || user?.name} 🍽️</p>
        </div>

        <button className="mess-logout-btn" onClick={handleLogout}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="mess-dashboard-stats">
        <div className="mess-stat-card">
          <ClipboardList size={22} />
          <div>
            <h3>{todayOrderCount}</h3>
            <p>Today's Orders</p>
          </div>
        </div>

        <div className="mess-stat-card">
          <Utensils size={22} />
          <div>
            <h3>₹{mess?.pricePerPerson}</h3>
            <p>Price / Thali</p>
          </div>
        </div>
      </div>

      <div className="mess-menu-section">
        <h3>Today's Menu</h3>

        {menuItems.map((item, index) => (
          <div className="mess-menu-row" key={index}>
            <input
              type="text"
              placeholder="e.g. Dal, Rice, Roti, Sabzi"
              value={item}
              onChange={(e) => handleItemChange(index, e.target.value)}
            />
            <button
              type="button"
              className="mess-remove-btn"
              onClick={() => removeItemField(index)}
              disabled={menuItems.length === 1}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button type="button" className="mess-add-btn" onClick={addItemField}>
          <Plus size={16} /> Add Item
        </button>

        <button
          type="button"
          className="mess-save-btn"
          onClick={handleSaveMenu}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Today's Menu"}
        </button>
      </div>

      <div className="mess-orders-section">
        <h3>Today's Orders</h3>

        {orders.length === 0 ? (
          <p className="mess-no-orders">No orders yet today.</p>
        ) : (
          <div className="mess-orders-list">
            {orders.map((order) => (
              <div className="mess-order-row" key={order._id}>
                <div>
                  <strong>{order.user?.name || "Unknown"}</strong>
                  <p>{order.user?.phone}</p>
                </div>
                <div className="mess-order-meta">
                  <span>{order.thaliCount} Thali(s)</span>
                  <span>₹{order.totalAmount}</span>
                  <span className={`mess-order-badge ${order.orderStatus}`}>
                    {order.orderStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessOwnerDashboard;
