import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/admin/theme.css";
import "../../styles/admin/furniture-admin.css";

const emptyVehicle = {
  name: "", brand: "", type: "Scooty", fuel: "Petrol", transmission: "Automatic", seats: "2",
  pricePerDay: "", pricePerWeek: "", pricePerMonth: "", pricePerHour: "",
  securityDeposit: "2000", freeKmPerDay: "130", extraKmCharge: "3.5",
  helmetIncluded: true, fuelPolicy: "", documentsRequired: "",
  isAvailable: true, isVisible: true,
};

function AddVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(emptyVehicle);
  const [oldPhotos, setOldPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(`/vehicles/admin/${id}`).then(({ data }) => {
      setForm(Object.fromEntries(Object.keys(emptyVehicle).map((key) => {
        if (typeof emptyVehicle[key] === "boolean") return [key, data[key] !== false];
        return [key, data[key] == null ? "" : String(data[key])];
      })));
      setOldPhotos(data.photos || []);
    }).catch((error) => toast.error(error.response?.data?.message || "Vehicle load nahi hua")).finally(() => setLoading(false));
  }, [id, editing]);

  const setField = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (editing) data.append("existingPhotos", JSON.stringify(oldPhotos));
    files.forEach((file) => data.append("photos", file));
    try {
      setSaving(true);
      if (editing) await api.put(`/vehicles/${id}`, data);
      else await api.post("/vehicles", data);
      toast.success(editing ? "Vehicle updated" : "Vehicle added");
      navigate("/admin/vehicles");
    } catch (error) {
      toast.error(error.response?.data?.message || "Vehicle save nahi hua");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-page"><p>Loading vehicle...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><h1>{editing ? "Edit Vehicle" : "Add Vehicle"}</h1><p>Vehicle catalog details, rental prices and requirements.</p></div>
        <Link to="/admin/vehicles" className="admin-btn secondary"><ArrowLeft size={16} /> Back</Link>
      </div>
      <form className="fa-form" onSubmit={submit}>
        <div className="fa-section">Vehicle details</div>
        <div className="fa-grid">
          <div className="fa-field"><label>Name *</label><input required value={form.name} onChange={setField("name")} placeholder="Activa 6G" /></div>
          <div className="fa-field"><label>Brand *</label><input required value={form.brand} onChange={setField("brand")} placeholder="Honda" /></div>
          <div className="fa-field"><label>Type *</label><select value={form.type} onChange={setField("type")}>{["Scooty", "Bike", "Car", "SUV", "Van"].map((value) => <option key={value}>{value}</option>)}</select></div>
          <div className="fa-field"><label>Fuel *</label><select value={form.fuel} onChange={setField("fuel")}>{["Petrol", "Diesel", "Electric"].map((value) => <option key={value}>{value}</option>)}</select></div>
          <div className="fa-field"><label>Transmission *</label><select value={form.transmission} onChange={setField("transmission")}>{["Manual", "Automatic"].map((value) => <option key={value}>{value}</option>)}</select></div>
          <div className="fa-field"><label>Seats *</label><input required type="number" min="1" value={form.seats} onChange={setField("seats")} /></div>
        </div>

        <div className="fa-section">Rental pricing (INR)</div>
        <div className="fa-grid">
          <div className="fa-field"><label>Price per day *</label><input required type="number" min="0" value={form.pricePerDay} onChange={setField("pricePerDay")} /></div>
          <div className="fa-field"><label>Price per week *</label><input required type="number" min="0" value={form.pricePerWeek} onChange={setField("pricePerWeek")} /></div>
          <div className="fa-field"><label>Price per month *</label><input required type="number" min="0" value={form.pricePerMonth} onChange={setField("pricePerMonth")} /></div>
          <div className="fa-field"><label>Price per hour (optional)</label><input type="number" min="0" value={form.pricePerHour} onChange={setField("pricePerHour")} /></div>
          <div className="fa-field"><label>Security deposit</label><input type="number" min="0" value={form.securityDeposit} onChange={setField("securityDeposit")} /></div>
          <div className="fa-field"><label>Free km per day</label><input type="number" min="0" value={form.freeKmPerDay} onChange={setField("freeKmPerDay")} /></div>
          <div className="fa-field"><label>Extra km charge (₹)</label><input type="number" min="0" step="0.5" value={form.extraKmCharge} onChange={setField("extraKmCharge")} /></div>
        </div>

        <div className="fa-section">Rental terms</div>
        <div className="fa-grid">
          <div className="fa-field"><label>Fuel policy</label><textarea rows="3" value={form.fuelPolicy} onChange={setField("fuelPolicy")} /></div>
          <div className="fa-field"><label>Documents required</label><textarea rows="3" value={form.documentsRequired} onChange={setField("documentsRequired")} /></div>
        </div>
        <div className="fa-section">Photos</div>
        {oldPhotos.length > 0 && <div className="fa-imgs">{oldPhotos.map((photo) => <div className="fa-img" key={photo}><img src={photo} alt="" loading="lazy" /><button type="button" aria-label="Remove photo" onClick={() => setOldPhotos((current) => current.filter((item) => item !== photo))}>×</button></div>)}</div>}
        <div className="fa-field"><label>Upload photos</label><input type="file" accept="image/*" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} /></div>
        <div className="fa-checks">
          <label><input type="checkbox" checked={Boolean(form.helmetIncluded)} onChange={setField("helmetIncluded")} /> Helmet included</label>
          <label><input type="checkbox" checked={Boolean(form.isAvailable)} onChange={setField("isAvailable")} /> Available</label>
          <label><input type="checkbox" checked={Boolean(form.isVisible)} onChange={setField("isVisible")} /> Visible on catalog</label>
        </div>
        <div className="fa-actions"><button className="admin-btn" type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Update Vehicle" : "Add Vehicle"}</button><Link to="/admin/vehicles" className="admin-btn secondary">Cancel</Link></div>
      </form>
    </div>
  );
}

export default AddVehicle;
