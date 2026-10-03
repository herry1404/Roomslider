import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Utensils, Plus, Trash2, LogOut, ClipboardList, MapPin, ReceiptText } from "lucide-react";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

import "../../styles/mess/dashboard.css";

function MessOwnerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mess, setMess] = useState(null);
  const [todayOrderCount, setTodayOrderCount] = useState(0);
  const [mealType, setMealType] = useState("thali");
  const [menuItems, setMenuItems] = useState([{ name: "", category: "Other", calories: "" }]);
  const [addOns, setAddOns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAddOns, setSavingAddOns] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/mess/me");
      setMess(res.data.mess);
      setTodayOrderCount(res.data.todayOrderCount || 0);

      const items = res.data.mess?.todayMenu?.items || [];
      setMealType(res.data.mess?.mealType || "thali");
      setMenuItems(items.length
        ? items.map((item) => ({
          name: item.name,
          category: item.category || "Other",
          calories: item.calories ?? "",
        }))
        : [{ name: "", category: "Other", calories: "" }]);
      setAddOns((res.data.mess?.addOns || []).map((item) => ({
        name: item.name,
        price: String(item.price),
        isAvailable: item.isAvailable !== false,
      })));

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
    Promise.resolve().then(fetchDashboard);
  }, []);

  const handleItemChange = (index, field, value) => {
    setMenuItems((prev) => prev.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  };

  const addItemField = () => {
    setMenuItems((prev) => [...prev, { name: "", category: "Other", calories: "" }]);
  };

  const removeItemField = (index) => {
    setMenuItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveMenu = async () => {
    const cleanItems = menuItems
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        category: item.category,
        calories: item.calories === "" ? null : Number(item.calories),
      }));
    if (cleanItems.some((item) => item.calories !== null && (!Number.isFinite(item.calories) || item.calories < 0))) {
      toast.error("Enter a valid calorie count or leave it blank.");
      return;
    }

    try {
      setSaving(true);
      const res = await api.put("/mess/me/menu", { items: cleanItems, mealType });
      setMess(res.data.mess);
      toast.success("Today's menu updated");
    } catch (error) {
      console.error("MENU UPDATE ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to update menu");
    } finally {
      setSaving(false);
    }
  };

  const updateAddOn = (index, field, value) => {
    setAddOns((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  };

  const saveAddOns = async () => {
    const cleanAddOns = addOns
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        price: Number(item.price),
        isAvailable: item.isAvailable,
      }));
    if (cleanAddOns.some((item) => !Number.isFinite(item.price) || item.price < 0)) {
      toast.error("Enter a valid price for each add-on.");
      return;
    }

    try {
      setSavingAddOns(true);
      const res = await api.put("/mess/me/add-ons", { addOns: cleanAddOns });
      setMess(res.data.mess);
      setAddOns((res.data.mess.addOns || []).map((item) => ({
        name: item.name,
        price: String(item.price),
        isAvailable: item.isAvailable !== false,
      })));
      toast.success("Available add-ons updated");
    } catch (error) {
      console.error("MESS ADD-ONS UPDATE ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to update add-ons");
    } finally {
      setSavingAddOns(false);
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
            <p>Price / {mealType === "tiffin" ? "Tiffin" : "Thali"}</p>
          </div>
        </div>
      </div>

      <div className="mess-menu-section">
        <div className="mess-menu-section-heading">
          <div>
            <h3>Today’s Menu</h3>
            <p>Choose how the menu should appear to customers, then add sections and calorie information.</p>
          </div>
          <label className="mess-meal-type">
            Menu style
            <select value={mealType} onChange={(event) => setMealType(event.target.value)}>
              <option value="thali">Thali</option>
              <option value="tiffin">Tiffin box</option>
            </select>
          </label>
        </div>

        {menuItems.map((item, index) => (
          <div className="mess-menu-row mess-menu-item-row" key={index}>
            <input
              type="text"
              placeholder="Dish name, e.g. Dal tadka"
              value={item.name}
              onChange={(event) => handleItemChange(index, "name", event.target.value)}
            />
            <select value={item.category} onChange={(event) => handleItemChange(index, "category", event.target.value)}>
              {(mealType === "thali"
                ? ["Dal & curry", "Rice", "Roti & bread", "Vegetables", "Salad & sides", "Dessert", "Other"]
                : ["Main", "Rice", "Roti & bread", "Side", "Snack", "Dessert", "Other"]
              ).map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <label className="mess-calorie-input">
              <input
                type="number"
                min="0"
                max="10000"
                placeholder="Calories"
                value={item.calories}
                onChange={(event) => handleItemChange(index, "calories", event.target.value)}
              />
              <span>kcal</span>
            </label>
            <button
              type="button"
              className="mess-remove-btn"
              onClick={() => removeItemField(index)}
              disabled={menuItems.length === 1}
              aria-label={`Remove ${item.name || "menu item"}`}
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

      <div className="mess-menu-section">
        <h3>Available Add-ons</h3>
        <p>Add optional sides customers can include with their thali, such as salad, pickle, or paratha.</p>

        {addOns.map((item, index) => (
          <div className="mess-menu-row mess-addon-row" key={`${item.name}-${index}`}>
            <input
              type="text"
              maxLength={80}
              placeholder="e.g. Salad, pickle, extra paratha"
              value={item.name}
              onChange={(event) => updateAddOn(index, "name", event.target.value)}
            />
            <label className="mess-addon-price">
              <span>₹</span>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Price"
                value={item.price}
                onChange={(event) => updateAddOn(index, "price", event.target.value)}
              />
            </label>
            <label className="mess-addon-availability">
              <input
                type="checkbox"
                checked={item.isAvailable}
                onChange={(event) => updateAddOn(index, "isAvailable", event.target.checked)}
              />
              Available
            </label>
            <button
              type="button"
              className="mess-remove-btn"
              onClick={() => setAddOns((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              aria-label={`Remove ${item.name || "add-on"}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button
          type="button"
          className="mess-add-btn"
          onClick={() => setAddOns((current) => [...current, { name: "", price: "", isAvailable: true }])}
        >
          <Plus size={16} /> Add side or extra
        </button>

        <button
          type="button"
          className="mess-save-btn"
          onClick={saveAddOns}
          disabled={savingAddOns}
        >
          {savingAddOns ? "Saving..." : "Save Available Add-ons"}
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
                <div className="mess-order-customer">
                  {order.user?.avatar
                    ? <img src={order.user.avatar} alt="" />
                    : <span className="mess-order-avatar">{(order.deliveryAddress?.recipientName || order.user?.name || "C").charAt(0).toUpperCase()}</span>}
                  <div>
                    <strong>{order.deliveryAddress?.recipientName || order.user?.name || "Customer"}</strong>
                    <p>{order.deliveryAddress?.phone || order.user?.phone}</p>
                  </div>
                </div>
                <div className="mess-order-details">
                  <p>{order.thaliCount} {order.mealType === "tiffin" ? "Tiffin box(es)" : "Thali(s)"}</p>
                  {order.addOns?.length > 0 && (
                    <p>{order.addOns.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p>
                  )}
                  <p className="mess-order-delivery-address">{order.deliveryAddress?.address}</p>
                  {order.deliveryAddress?.mapLink && (
                    <a href={order.deliveryAddress.mapLink} target="_blank" rel="noreferrer">
                      <MapPin size={14} /> Open delivery location
                    </a>
                  )}
                </div>
                <div className="mess-order-meta">
                  <span className="mess-payment-paid"><ReceiptText size={15} /> Paid · ₹{Number(order.totalAmount).toLocaleString("en-IN")}</span>
                  <span>Receipt #{String(order._id).slice(-8).toUpperCase()}</span>
                  {order.razorpayPaymentId && <span>Payment ref {order.razorpayPaymentId}</span>}
                  <span>{new Date(order.paidAt || order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                  <span className={`mess-order-badge ${order.orderStatus}`}>{order.orderStatus}</span>
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
