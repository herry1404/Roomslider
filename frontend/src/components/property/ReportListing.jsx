import { useState } from "react";
import { Flag, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "../../styles/listing-report.css";

export default function ReportListing({ roomId }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  const openReport = () => {
    if (!user) {
      toast.error("Please log in to report this listing");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (sending) return;
    try {
      setSending(true);
      await api.post(`/reports/listings/${roomId}`, { reason });
      toast.success("Listing reported for review");
      setReason("");
      setOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Report could not be submitted");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button type="button" className="pd-report-listing" onClick={openReport}>
        <Flag size={16} /> Report listing
      </button>
      {open && (
        <div className="listing-report-backdrop" onClick={() => setOpen(false)}>
          <section
            className="listing-report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="listing-report-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="listing-report-close" type="button" onClick={() => setOpen(false)} aria-label="Close">
              <X size={19} />
            </button>
            <h2 id="listing-report-title">Report this listing</h2>
            <p>Tell us what seems wrong so our team can review it.</p>
            <form onSubmit={submit}>
              <label htmlFor="listing-report-reason">Reason</label>
              <textarea
                id="listing-report-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                minLength={5}
                maxLength={500}
                rows={4}
                placeholder="Describe the issue"
                required
              />
              <button className="listing-report-submit" type="submit" disabled={sending}>
                {sending ? "Submitting…" : "Submit report"}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
