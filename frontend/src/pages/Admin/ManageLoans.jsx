import { useEffect, useState } from "react";
import axios from "../../api/axios";
import toast from "react-hot-toast";
import { Banknote, Phone, Mail, GraduationCap, User } from "lucide-react";
import "../../styles/loan-modal.css";

const STATUS_OPTIONS = ["new", "contacted", "approved", "rejected"];

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
    try {
      await axios.put(`/loans/${id}/status`, { status: newStatus });
      setLoans((prev) =>
        prev.map((loan) =>
          loan._id === id ? { ...loan, status: newStatus } : loan
        )
      );
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (loading) return <div className="admin-page-loading">Loading loan requests...</div>;

  return (
    <div className="manage-loans-page">
      <h2 className="page-title">
        <Banknote size={22} /> Student Loan Requests
      </h2>

      {loans.length === 0 ? (
        <p className="no-data">No loan requests yet.</p>
      ) : (
        <div className="owner-card-grid">
          {loans.map((loan) => (
            <div className="owner-card" key={loan._id}>
              <div className="owner-card-header">
                <User size={18} />
                <h3>{loan.studentName || loan.name}</h3>
                <span className={`status-badge status-${loan.status}`}>
                  {loan.status}
                </span>
              </div>

              <div className="owner-card-body">
                <p><Phone size={14} /> {loan.phone}</p>
                {loan.email && <p><Mail size={14} /> {loan.email}</p>}
                <p><GraduationCap size={14} /> {loan.course || loan.education}</p>
                <p><strong>Amount:</strong> ₹{loan.loanAmount}</p>
                <p><strong>Purpose:</strong> {loan.loanPurpose}</p>
                <p><strong>ID Type:</strong> {loan.idType}</p>
                {loan.idPhotoUrl && (
                  <a href={loan.idPhotoUrl} target="_blank" rel="noreferrer">
                    View ID Photo
                  </a>
                )}
                <p><strong>Family Income:</strong> {loan.familyIncomeRange}</p>
                <p><strong>Guardian:</strong> {loan.guardianName} ({loan.guardianPhone})</p>
              </div>

              <div className="owner-card-footer">
                <label>Status:</label>
                <select
                  value={loan.status}
                  onChange={(e) => handleStatusChange(loan._id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageLoans;
