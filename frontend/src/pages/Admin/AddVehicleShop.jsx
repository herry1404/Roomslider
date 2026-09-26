import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/add-room.css";

function AddVehicleShop() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);

  const [formData, setFormData] = useState({
    shopName: "",
    address: "",
    city: "Indore",
    contactNumber: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length === 0) {
      toast.error("Please select shop images");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("shopName", formData.shopName);
      data.append("address", formData.address);
      data.append("city", formData.city);
      data.append("contactNumber", formData.contactNumber);
      images.forEach((image) => data.append("images", image));

      await api.post("/vehicle-shops", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Vehicle shop added ✅");
      navigate("/admin/vehicles");
    } catch (error) {
      toast.error(error.response?.data?.message || "Shop add nahi ho paya");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-room-page">
      <div className="add-room-card">
        <h1>Add Vehicle Rental Shop</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2 className="section-title">Shop Details</h2>

            <div className="form-row">
              <input
                type="text"
                name="shopName"
                placeholder="Shop Name"
                value={formData.shopName}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <input
                type="text"
                name="address"
                placeholder="Full Address"
                value={formData.address}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="contactNumber"
                placeholder="Contact Number"
                value={formData.contactNumber}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Shop Images</h2>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} />
            <div className="preview-grid">
              {images.map((image, index) => (
                <div className="preview-card" key={index}>
                  <img src={URL.createObjectURL(image)} alt="" />
                  <button type="button" onClick={() => removeImage(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button className="publish-btn" disabled={loading}>
            {loading ? "Publishing..." : "Add Shop"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddVehicleShop;
