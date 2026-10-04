import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/add-room.css";
import "../../styles/admin/theme.css";

const CATEGORIES = [
  { value: "cleaning", label: "Cleaning & Housekeeping" },
  { value: "packers", label: "Packers & Movers" },
  { value: "furniture", label: "Furniture & Appliance Rental" },
  { value: "wifi", label: "WiFi & RO Water" },
  { value: "appliance-repair", label: "Appliance Repair" },
  { value: "study-support", label: "Study Support" },
  { value: "rent-agreement", label: "Rent Agreement" },
];

const PER_UNITS = ["month", "day", "hour", "visit", "washroom", "room", "person", "machine", "page"];
const emptyPrice = () => ({ name: "", type: "monthly", price: "", unit: "", note: "", perUnit: "month", allowQuantity: false });

function AddService() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [priceList, setPriceList] = useState([]);

  const [formData, setFormData] = useState({
    category: "cleaning",
    name: "",
    area: "",
    city: "Indore",
    contactNumber: "",
    priceNote: "",
    subType: "",
    experienceYears: "",
    languages: "",
    availability: "",
    serviceAreas: "",
    isVerified: false,
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category" ? { subType: value === "study-support" ? "library" : value === "rent-agreement" ? "agreement" : "" } : {}),
    }));
  };

  const handleImageChange = (e) => setImages(Array.from(e.target.files));
  const removeImage = (index) => setImages(images.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      data.append("priceList", JSON.stringify(priceList.filter((item) => item.name && item.price !== "").map((item) => ({ ...item, price: Number(item.price) }))));
      data.set("languages", JSON.stringify(formData.languages.split(",").map((item) => item.trim()).filter(Boolean)));
      data.set("serviceAreas", JSON.stringify(formData.serviceAreas.split(",").map((item) => item.trim()).filter(Boolean)));
      images.forEach((image) => data.append("images", image));

      await api.post("/services", data);

      toast.success("Provider added ✅");
      navigate("/admin/services");
    } catch (error) {
      toast.error(error.response?.data?.message || "Provider add nahi ho paaya");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-room-page admin-page">
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

          {(formData.category === "study-support" || formData.category === "rent-agreement") && (
            <div className="form-section">
              <h2>Service Type</h2>
              <select name="subType" value={formData.subType} onChange={handleChange}>
                {(formData.category === "study-support"
                  ? [["library", "Library"], ["tutor", "Tutor"], ["printing", "Printing"], ["exam-help", "Exam help"]]
                  : [["agreement", "Agreement"], ["police-verification", "Police verification"]]
                ).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          )}

          <div className="form-section">
            <h2 className="section-title">Price List</h2>
            {priceList.map((item, index) => (
              <div className="admin-toolbar" key={index}>
                <div className="admin-search"><input aria-label="Service name" placeholder="Service name" value={item.name} onChange={(e) => setPriceList((rows) => rows.map((row, i) => i === index ? { ...row, name: e.target.value } : row))} /></div>
                <select value={item.type} onChange={(e) => setPriceList((rows) => rows.map((row, i) => i === index ? { ...row, type: e.target.value } : row))}>
                  <option value="monthly">Monthly</option><option value="one-time">One-time</option>
                </select>
                <div className="admin-search"><input aria-label="Price" type="number" min="0" placeholder="Price" value={item.price} onChange={(e) => setPriceList((rows) => rows.map((row, i) => i === index ? { ...row, price: e.target.value } : row))} /></div>
                <select aria-label="Rate per" value={item.perUnit} onChange={(e) => setPriceList((rows) => rows.map((row, i) => i === index ? { ...row, perUnit: e.target.value, unit: "" } : row))}>{PER_UNITS.map((unit) => <option key={unit} value={unit}>per {unit}</option>)}</select>
                <label className="admin-badge blue"><input type="checkbox" checked={item.allowQuantity} onChange={(e) => setPriceList((rows) => rows.map((row, i) => i === index ? { ...row, allowQuantity: e.target.checked } : row))} /> Customer chooses quantity</label>
                <button type="button" className="admin-btn secondary" onClick={() => setPriceList((rows) => rows.filter((_, i) => i !== index))}>Remove</button>
              </div>
            ))}
            <button type="button" className="admin-btn secondary" onClick={() => setPriceList((rows) => [...rows, emptyPrice()])}>Add price</button>
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
              <input type="number" min="0" name="experienceYears" placeholder="Experience (years)" value={formData.experienceYears} onChange={handleChange} />
              <input type="text" name="languages" placeholder="Languages (comma separated)" value={formData.languages} onChange={handleChange} />
            </div>

            <div className="form-row">
              <input type="text" name="availability" placeholder="Availability (e.g. 6 AM - 10 AM)" value={formData.availability} onChange={handleChange} />
              <input type="text" name="serviceAreas" placeholder="Service areas (comma separated)" value={formData.serviceAreas} onChange={handleChange} />
            </div>

            <label className="admin-badge green"><input type="checkbox" name="isVerified" checked={formData.isVerified} onChange={(e) => setFormData((prev) => ({ ...prev, isVerified: e.target.checked }))} /> Verified worker</label>

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
            <h2>Worker photo (optional)</h2>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} />
            <div className="preview-grid">
              {images.map((image, index) => (
                <div className="preview-card" key={index}>
                  <img src={URL.createObjectURL(image)} alt="" loading="lazy" />
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
