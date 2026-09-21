import { useState } from "react";
import { X, Banknote } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/loan-modal.css";

function LoanModal({ onClose }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    address: "",
    amount: "",
    purpose: "other",
    note: "",
    college: "",
    course: "",
    pan: "",
    guardianName: "",
    guardianPhone: "",
    guardianOccupation: "",
    familyIncomeRange: "",
    idType: "",
  });
  const [idPhoto, setIdPhoto] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = {
      name: "Naam",
      phone: "Phone",
      email: "Email",
      dob: "Date of birth",
      address: "Address",
      amount: "Amount",
      college: "College",
      course: "Course",
      pan: "PAN number",
      guardianName: "Guardian name",
      guardianPhone: "Guardian phone",
      guardianOccupation: "Guardian occupation",
      familyIncomeRange: "Family income",
      idType: "ID type",
    };
    for (const [key, label] of Object.entries(requiredFields)) {
      if (!String(form[key]).trim()) {
        toast.error(`${label} bharna zaroori hai`);
        return;
      }
    }
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      toast.error("Sahi 10 digit phone number daalo");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.guardianPhone)) {
      toast.error("Guardian ka sahi 10 digit phone number daalo");
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(form.pan)) {
      toast.error("Sahi PAN number daalo (jaise ABCDE1234F)");
      return;
    }
    if (!idPhoto) {
      toast.error("ID photo upload karna zaroori hai");
      return;
    }

    if (!consentGiven) {
      toast.error("Consent checkbox tick karna zaroori hai");
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });
      data.append("consentGiven", "true");
      if (idPhoto) data.append("idPhoto", idPhoto);

      await api.post("/loans", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Request submit ho gayi! Hum jald contact karenge.");
      onClose();
    } catch (error) {
      console.error("LOAN SUBMIT ERROR:", error);
      toast.error(error.response?.data?.message || "Submit nahi ho paya");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="loan-overlay">
      <div className="loan-card">
        <button className="loan-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="loan-header">
          <Banknote size={26} color="var(--color-primary, #16a34a)" />
          <h2>Student Loan Assistance</h2>
          <p>Apni details bharo, hum partner lenders tak pahunchayenge</p>
        </div>

        <form className="loan-body" onSubmit={handleSubmit}>
          <div className="loan-section-title">Basic details</div>
          <input placeholder="Full name" required value={form.name} onChange={update("name")} />
          <div className="loan-row-2">
            <input placeholder="Phone" required value={form.phone} onChange={update("phone")} />
            <input placeholder="Email" type="email" required value={form.email} onChange={update("email")} />
          </div>
          <div className="loan-row-2">
            <input placeholder="Date of birth" type="date" required value={form.dob} onChange={update("dob")} />
            <input placeholder="Address" required value={form.address} onChange={update("address")} />
          </div>

          <div className="loan-section-title">Loan details</div>
          <div className="loan-row-2">
            <input placeholder="Amount needed (₹)" type="number" required value={form.amount} onChange={update("amount")} />
            <select value={form.purpose} onChange={update("purpose")}>
              <option value="rent">Rent</option>
              <option value="deposit">Security Deposit</option>
              <option value="fees">College Fees</option>
              <option value="other">Other</option>
            </select>
          </div>
          <textarea placeholder="Any extra note (optional)" value={form.note} onChange={update("note")} />

          <div className="loan-section-title">Education</div>
          <div className="loan-row-2">
            <input placeholder="College / University" required value={form.college} onChange={update("college")} />
            <input placeholder="Course" required value={form.course} onChange={update("course")} />
          </div>

          <div className="loan-section-title">Eligibility (KYC lite)</div>
          <input placeholder="PAN number" required value={form.pan} onChange={update("pan")} />
          <div className="loan-row-2">
            <input placeholder="Guardian name" required value={form.guardianName} onChange={update("guardianName")} />
            <input placeholder="Guardian phone" required value={form.guardianPhone} onChange={update("guardianPhone")} />
          </div>
          <div className="loan-row-2">
            <input placeholder="Guardian occupation" required value={form.guardianOccupation} onChange={update("guardianOccupation")} />
            <select required value={form.familyIncomeRange} onChange={update("familyIncomeRange")}>
              <option value="">Family income</option>
              <option value="below_2l">Below ₹2L/yr</option>
              <option value="2l_5l">₹2L - ₹5L/yr</option>
              <option value="5l_10l">₹5L - ₹10L/yr</option>
              <option value="above_10l">Above ₹10L/yr</option>
            </select>
          </div>

          <div className="loan-section-title">ID verification</div>
          <select required value={form.idType} onChange={update("idType")}>
            <option value="">Select ID type</option>
            <option value="aadhaar">Aadhaar</option>
            <option value="voter_id">Voter ID</option>
            <option value="driving_license">Driving License</option>
            <option value="college_id">College ID</option>
          </select>
          <label className="loan-file-label">
            Upload ID photo (front side)
            <input
              type="file"
              required
              accept="image/*"
              onChange={(e) => setIdPhoto(e.target.files[0])}
            />
          </label>

          <label className="loan-consent">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
            />
            Main confirm karta/karti hoon ki ye jaankari sahi hai aur RoomSlider ko lending partners ke saath share karne ki permission deta/deti hoon.
          </label>

          <button type="submit" className="loan-submit" disabled={saving}>
            {saving ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoanModal;
