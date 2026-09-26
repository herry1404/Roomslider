import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/add-room.css";

function AddVehicle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState([]);

  const [formData, setFormData] = useState({
    shop: "",
    name: "",
    type: "Scooty",
    fuel: "",
    kmLimit: "",
    docRequired: "",
    pricePerHour: "",
    pricePerDay: "",
    pricePerMonth: "",
    deposit: "",
    availabilityNote: "Available now",
  });

  useEffect(() => {
    api
      .get("/vehicle-shops")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.shops || [];
        setShops(data);
      })
      .catch(() => toast.error("Shops load nahi ho paayi"));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.shop) {
      toast.error("Please select a shop");
      return;
    }

    setLoading(true);
    try {
      await api.post("/vehicles", formData);
      toast.success("Vehicle added ✅");
      navigate("/admin/vehicles");
    } catch (error) {
      toast.error(error.response?.data?.message || "Vehicle add nahi ho paayi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-room-page">
      <div className="add-room-card">
        <h1>Add Vehicle</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2 className="section-title">Shop</h2>
            <select name="shop" value={formData.shop} onChange={handleChange} required>
              <option value="">Select Shop</option>
              {shops.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.shopName} — {s.city}
                </option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <h2>Vehicle Details</h2>

            <div className="form-row">
              <input
                type="text"
                name="name"
                placeholder="Vehicle Name (e.g. Activa 6G)"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="Scooty">Scooty</option>
                <option value="Bike">Bike</option>
                <option value="Electric">Electric</option>
                <option value="Cycle">Cycle</option>
              </select>
            </div>

            <div className="form-row">
              <input
                type="text"
                name="fuel"
                placeholder="Fuel (Petrol / Electric / None)"
                value={formData.fuel}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="kmLimit"
                placeholder="KM Limit (e.g. 100 km/day)"
                value={formData.kmLimit}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <input
                type="text"
                name="docRequired"
                placeholder="Documents Required (e.g. Aadhar + DL)"
                value={formData.docRequired}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="availabilityNote"
                placeholder="Availability Note"
                value={formData.availabilityNote}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Pricing</h2>
            <div className="input-grid">
              <input
                type="number"
                name="pricePerHour"
                placeholder="Price / Hour"
                value={formData.pricePerHour}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="pricePerDay"
                placeholder="Price / Day"
                value={formData.pricePerDay}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="pricePerMonth"
                placeholder="Price / Month"
                value={formData.pricePerMonth}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="deposit"
                placeholder="Security Deposit"
                value={formData.deposit}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button className="publish-btn" disabled={loading}>
            {loading ? "Publishing..." : "Add Vehicle"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddVehicle;
