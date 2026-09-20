import { useEffect, useState } from "react";
import axios from "../../api/axios";
import toast from "react-hot-toast";
import {
  Banknote,
  Phone,
  Mail,
  GraduationCap,
  User,
  MessageCircle,
} from "lucide-react";
import "../../styles/admin-loans.css";

const STATUS_OPTIONS = ["new", "contacted", "approved", "rejected"];

const PURPOSE_LABELS = {
  rent: "Rent",
  deposit: "Deposit",
  fees: "College fees",
  other: "Other",
};

const INCOME_LABELS = {
  below_2l: "Below ₹2 lakh",
  "2l_5l": "₹2 - 5 lakh",
  "5l_10l": "₹5 - 10 lakh",
  above_10l: "Above ₹10 lakh",
};

const ID_LABELS = {
  aadhaar: "Aadhaar",
  voter_id: "Voter ID",
  driving_license: "Driving licence",
  college_id: "College ID",
};

const tenDigits = (p) => String(p || "").replace(/\D/g, "").slice(-10);

const formatAmount = (n) =>
  n || n === 0 ? `₹${Number(n).toLocaleString("en-IN")}` : "-";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const Row = ({ label, children }) => (
  <div className="ml-row">
    <span className="ml-label">{label}</span>
    <span className="ml-value">{children || "-"}</span>
  </div>
);

const ManageLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/loans");
      setLoans(res.data.loans || res.data);
    } catch (err) {
      toast.error("Failed to load loan requests");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    if (
      ["approved", "rejected"].includes(newStatus) &&
      !window.confirm(
        "Applicant ki ID photo hamesha ke liye delete ho jayegi. Continue?"
      )
    ) {
      return;
    }
    try {
      await axios.put(`/loans/${id}/status`, { status: newStatus });
      setLoans((prev) =>
        prev.map((loan) =>
          loan._id === id ? {
                ...loan,
                status: newStatus,
                ...(["approved", "rejected"].includes(newStatus)
                  ? { idPhotoUrl: null }
                  : {}),
              } : loan
        )
      );
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return <div className="ml-page">Loading loan requests...</div>;
  }

  return (
    <div className="ml-page">
      <h2 className="ml-title">
        <Banknote size={22} /> Student Loan Requests
      </h2>

      {loans.length === 0 ? (
        <p className="ml-empty">No loan requests yet.</p>
      ) : (
        <div className="ml-grid">
          {loans.map((loan) => {
            const phone = tenDigits(loan.phone);
            const guardianPhone = tenDigits(loan.guardianPhone);
            const waText = encodeURIComponent(
              `Hi ${loan.name}, this is RoomSlider about your student loan request.`
            );

            return (
              <div className="ml-card" key={loan._id}>
                <div className="ml-card-header">
                  <User size={18} />
                  <h3 className="ml-name">{loan.name}</h3>
                  <span className={`ml-badge ml-badge--${loan.status}`}>
                    {loan.status}
                  </span>
                </div>

                <div className="ml-actions">
                  <a className="ml-btn ml-btn--call" href={`tel:+91${phone}`}>
                    <Phone size={16} /> Call
                  </a>
                  <a
                    className="ml-btn ml-btn--wa"
                    href={`https://wa.me/91${phone}?text=${waText}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                </div>

                <div className="ml-amount">{formatAmount(loan.amount)}</div>

                <div className="ml-rows">
                  <div className="ml-row">
                    <Phone size={14} />
                    <span className="ml-value">{phone}</span>
                  </div>
                  {loan.email && (
                    <div className="ml-row">
                      <Mail size={14} />
                      <span className="ml-value">{loan.email}</span>
                    </div>
                  )}
                  <div className="ml-row">
                    <GraduationCap size={14} />
                    <span className="ml-value">
                      {[loan.course, loan.college].filter(Boolean).join(", ") ||
                        "-"}
                    </span>
                  </div>

                  <Row label="Purpose">
                    {PURPOSE_LABELS[loan.purpose] || loan.purpose}
                  </Row>
                  {loan.note && <Row label="Note">{loan.note}</Row>}
                  <Row label="Family income">
                    {INCOME_LABELS[loan.familyIncomeRange]}
                  </Row>
                  <Row label="ID type">
                    {ID_LABELS[loan.idType] || loan.idType}
                  </Row>
                  {loan.idPhotoUrl && (
                    <Row label="ID photo">
                      <a
                        className="ml-link"
                        href={loan.idPhotoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View ID Photo
                      </a>
                    </Row>
                  )}
                  {(loan.guardianName || guardianPhone) && (
                    <Row label="Guardian">
                      {loan.guardianName}
                      {loan.guardianOccupation
                        ? ` (${loan.guardianOccupation})`
                        : ""}
                      {guardianPhone && (
                        <>
                          {" "}
                          <a
                            className="ml-link"
                            href={`tel:+91${guardianPhone}`}
                          >
                            {guardianPhone}
                          </a>
                        </>
                      )}
                    </Row>
                  )}
                  <Row label="Applied on">{formatDate(loan.createdAt)}</Row>
                </div>

                <div className="ml-footer">
                  <label>Status:</label>
                  <select
                    className="ml-select"
                    value={loan.status}
                    onChange={(e) =>
                      handleStatusChange(loan._id, e.target.value)
                    }
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageLoans;
