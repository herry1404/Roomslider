import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import indoreAreas from "../../data/indoreAreas";
import "../../styles/blood.css";

const DISCLAIMER = "RoomSlider only connects people. It is not a blood bank or a medical service. In an emergency call 108 or contact the nearest blood bank. Blood must not be bought or sold. Verify the request at the hospital before donating.";
const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const localDateTime = () => {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const account = () => {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
};

function BloodRequestForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = account();
  const [saving, setSaving] = useState(false);
  const [contactConsent, setContactConsent] = useState(false);
  const [form, setForm] = useState({
    patientName: "", bloodGroup: "", unitsNeeded: "1", hospitalName: "", area: "",
    address: "", neededBy: "", urgency: "urgent",
    contactName: currentUser?.name || "", contactNumber: currentUser?.phone || "", note: "",
  });
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!localStorage.getItem("token")) {
      navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    if (!contactConsent) return toast.error("Confirm contact sharing to submit this request");
    setSaving(true);
    try {
      const { data } = await api.post("/blood-requests", { ...form, unitsNeeded: Number(form.unitsNeeded), contactConsent });
      toast.success("Blood request submitted for review");
      navigate(`/blood/requests/${data.request._id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Blood request could not be submitted");
    } finally {
      setSaving(false);
    }
  };

  return <main className="blood-page blood-form-page">
    <Link to="/blood" className="blood-back"><ArrowLeft size={16} /> Blood requests</Link>
    <header className="blood-page-heading"><h1>Request blood</h1><p>Requests are reviewed before they are sent to eligible donors.</p></header>
    <div className="blood-disclaimer">{DISCLAIMER}</div>
    <form className="blood-form" onSubmit={submit}>
      <div className="blood-form-grid">
        <label>Patient name<input required maxLength={100} value={form.patientName} onChange={update("patientName")} /></label>
        <label>Blood group<select required value={form.bloodGroup} onChange={update("bloodGroup")}><option value="">Select group</option>{GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label>
        <label>Units needed<input type="number" min="1" max="20" required value={form.unitsNeeded} onChange={update("unitsNeeded")} /></label>
        <label>Hospital name<input required maxLength={180} value={form.hospitalName} onChange={update("hospitalName")} /></label>
        <label>Area<select required value={form.area} onChange={update("area")}><option value="">Select Indore area</option>{indoreAreas.map((area) => <option key={area.name} value={area.name}>{area.name}</option>)}<option value="Other">Other</option></select></label>
        <label>Needed by<input type="datetime-local" required min={localDateTime()} value={form.neededBy} onChange={update("neededBy")} /></label>
        <label>Urgency<select value={form.urgency} onChange={update("urgency")}><option value="critical">Critical</option><option value="urgent">Urgent</option><option value="planned">Planned</option></select></label>
        <label>Contact name<input required maxLength={100} value={form.contactName} onChange={update("contactName")} /></label>
        <label>Contact number<input required inputMode="tel" maxLength={25} value={form.contactNumber} onChange={update("contactNumber")} /></label>
        <label className="blood-form-wide">Hospital address (optional)<input maxLength={500} value={form.address} onChange={update("address")} /></label>
        <label className="blood-form-wide">Note (optional)<textarea rows="3" maxLength={1000} value={form.note} onChange={update("note")} placeholder="Share practical details for review. Do not include donor contact information." /></label>
      </div>
      <label className="blood-consent-check"><input type="checkbox" checked={contactConsent} onChange={(event) => setContactConsent(event.target.checked)} /><span>I consent to my contact number being shown only to donors who offer to help.</span></label>
      <button className="blood-primary blood-submit" disabled={saving}>{saving ? "Submitting…" : "Submit blood request"}</button>
      <p className="blood-form-limit">A maximum of 3 requests can be submitted per day.</p>
    </form>
  </main>;
}

export default BloodRequestForm;
