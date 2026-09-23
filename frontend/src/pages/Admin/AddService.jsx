import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/add-room.css";

const CATEGORIES = [
  { value: "cleaning", label: "Cleaning & Housekeeping" },
  { value: "packers", label: "Packers & Movers" },
  { value: "furniture", label: "Furniture & Appliance Rental" },
  { value: "wifi", label: "WiFi & RO Water" },
  { value: "appliance-repair", label: "Appliance Repair" },
];

function AddService() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);

  const [formData, setFormData] = useState({
    category: "cleaning",
    name: "",
    area: "",
    city: "Indore",
    contactNumber: "",
    priceNote: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => setImages(Array.from(e.target.files));
  const removeImage = (index) => setImages(images.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      images.forEach((image) => data.append("images", image));

      await api.post("/services", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Provider added ✅");
      navigate("/admin/services");
    } catch (error) {
      toast.error(error.response?.data?.message || "Provider add nahi ho paaya");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-room-page">
      <div className="add-room-card">
        <h1>Add Service Provider</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2 className="section-title">Category</h2>
            <select name="category" value={formData.category} onChange={handleChange}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <h2>Provider Details</h2>

            <div className="form-row">
              <input
                type="text"
                name="name"
                placeholder="Provider / Business Name"
                value={formData.name}
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

            <div className="form-row">
              <input
                type="text"
                name="area"
                placeholder="Service Area"
                value={formData.area}
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
                name="priceNote"
                placeholder="Price Note (e.g. Starting ₹149)"
                value={formData.priceNote}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Images (optional)</h2>
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

          <div className="form-section">
            <h2>Description</h2>
            <textarea
              name="description"
              rows="5"
              placeholder="Short description of the services offered..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <button className="publish-btn" disabled={loading}>
            {loading ? "Publishing..." : "Add Provider"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddService;
