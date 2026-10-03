import { Fragment, useCallback, useEffect, useState } from "react";
import axios from "../../api/axios";
import toast from "react-hot-toast";
import {
  Banknote,
  Phone,
  Mail,
  GraduationCap,
  MessageCircle,
} from "lucide-react";
import "../../styles/admin/theme.css";

const STATUS_OPTIONS = ["submitted", "under_review", "contacted", "approved", "rejected"];
const STATUS_LABELS = {
  submitted: "Submitted",
  under_review: "Under review",
  contacted: "Contacted",
  approved: "Approved",
  rejected: "Not approved",
};

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

const formatAmount = (n) => (n || n === 0 ? `₹${Number(n).toLocaleString("en-IN")}` : "-");

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "-";

function ManageLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchLoans = useCallback(async () => {
    try {
      const res = await axios.get("/loans");
      setLoans(res.data.loans || res.data);
    } catch {
      toast.error("Failed to load loan requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetchLoans);
  }, [fetchLoans]);

  const handleStatusChange = async (id, newStatus) => {
    if (
      ["approved", "rejected"].includes(newStatus) &&
      !window.confirm("Applicant ki ID photo hamesha ke liye delete ho jayegi. Continue?")
    ) {
      return;
    }
    try {
      const response = await axios.put(`/loans/${id}/status`, { status: newStatus });
      setLoans((prev) =>
        prev.map((loan) =>
          loan._id === id
            ? {
                ...loan,
                status: response.data.loan?.status || newStatus,
                statusHistory: response.data.loan?.statusHistory || loan.statusHistory,
                ...(["approved", "rejected"].includes(newStatus) ? { idPhotoUrl: null } : {}),
              }
            : loan
        )
      );
      toast.success("Status updated");
    } catch (err) {
      const updatedLoan = err.response?.data?.loan;
      if (err.response?.data?.statusUpdated && updatedLoan) {
        setLoans((prev) =>
          prev.map((loan) => (loan._id === id ? { ...loan, ...updatedLoan } : loan))
        );
      }
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const pending = loans.filter((l) => ["new", "submitted", "under_review"].includes(l.status)).length;
  const approved = loans.filter((l) => l.status === "approved").length;

  if (loading) {
    return (
      <div className="admin-page">
        <p style={{ color: "var(--admin-muted)" }}>Loading loan requests...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Student Loan Requests</h1>
          <p>Applicant details and their loan status.</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total Requests</span>
            <div className="admin-stat-icon admin-badge green">
              <Banknote size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{loans.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Pending review</span>
            <div className="admin-stat-icon admin-badge amber">
              <Banknote size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{pending}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Approved</span>
            <div className="admin-stat-icon admin-badge green">
              <Banknote size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{approved}</div>
        </div>
      </div>

      <div className="admin-table-wrap">
        {loans.length === 0 ? (
          <div className="admin-empty">
            <h3>No loan requests yet</h3>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Amount</th>
                <th>Purpose</th>
                <th>Applied On</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const phone = tenDigits(loan.phone);
                const guardianPhone = tenDigits(loan.guardianPhone);
                const waText = encodeURIComponent(
                  `Hi ${loan.name}, this is RoomSlider about your student loan request.`
                );
                const expanded = expandedId === loan._id;
                const applicantName = loan.name;

                return (
                  <Fragment key={loan._id}>
                    <tr
                      style={{ cursor: "pointer" }}
                      onClick={() => setExpandedId(expanded ? null : loan._id)}
                    >
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600 }}>
                          {loan.user?.avatar ? (
                            <img
                              src={loan.user.avatar}
                              alt=""
                              style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                display: "grid",
                                placeItems: "center",
                                background: "var(--admin-border)",
                              }}
                            >
                              {applicantName.trim().charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span>{applicantName}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatAmount(loan.amount)}</td>
                      <td style={{ color: "var(--admin-muted)" }}>
                        {PURPOSE_LABELS[loan.purpose] || loan.purpose}
                      </td>
                      <td style={{ color: "var(--admin-muted)" }}>{formatDate(loan.createdAt)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          value={loan.status === "new" ? "submitted" : loan.status}
                          onChange={(e) => handleStatusChange(loan._id, e.target.value)}
                          style={{
                            background: "var(--admin-bg)",
                            border: "1px solid var(--admin-border)",
                            borderRadius: 8,
                            padding: "4px 8px",
                            color: "var(--admin-text)",
                            fontSize: 12.5,
                          }}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {STATUS_LABELS[opt]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="admin-row-actions" style={{ justifyContent: "flex-end" }}>
                          <a className="admin-icon-btn accent" href={`tel:+91${phone}`} title="Call">
                            <Phone size={16} />
                          </a>
                          <a
                            className="admin-icon-btn accent"
                            href={`https://wa.me/91${phone}?text=${waText}`}
                            target="_blank"
                            rel="noreferrer"
                            title="WhatsApp"
                          >
                            <MessageCircle size={16} />
                          </a>
                        </div>
                      </td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={6} style={{ background: "rgba(15,23,42,0.4)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, padding: "10px 4px", fontSize: 13.5 }}>
                            <div><Phone size={13} style={{ verticalAlign: -2 }} /> {phone}</div>
                            {loan.email && <div><Mail size={13} style={{ verticalAlign: -2 }} /> {loan.email}</div>}
                            <div><GraduationCap size={13} style={{ verticalAlign: -2 }} /> {[loan.course, loan.college].filter(Boolean).join(", ") || "-"}</div>
                            {loan.address && <div>Address: {loan.address}</div>}
                            {loan.currentLocation && (
                              <div>
                                <a
                                  href={`https://www.google.com/maps?q=${loan.currentLocation.latitude},${loan.currentLocation.longitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: "var(--admin-accent)" }}
                                >
                                  View detected location
                                </a>
                              </div>
                            )}
                            {loan.note && <div>Note: {loan.note}</div>}
                            <div>Family income: {INCOME_LABELS[loan.familyIncomeRange]}</div>
                            <div>ID type: {ID_LABELS[loan.idType] || loan.idType}</div>
                            {loan.idPhotoUrl && (
                              <div>
                                <a href={loan.idPhotoUrl} target="_blank" rel="noreferrer" style={{ color: "var(--admin-accent)" }}>
                                  View ID Photo
                                </a>
                              </div>
                            )}
                            {(loan.guardianName || guardianPhone) && (
                              <div>
                                Guardian: {loan.guardianName} {loan.guardianOccupation ? `(${loan.guardianOccupation})` : ""}{" "}
                                {guardianPhone && (
                                  <a href={`tel:+91${guardianPhone}`} style={{ color: "var(--admin-accent)" }}>
                                    {guardianPhone}
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ManageLoans;
