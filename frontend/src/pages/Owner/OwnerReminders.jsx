import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MessageCircle, Bell } from "lucide-react";

import api from "../../api/axios";

import "../../styles/owner/dashboard.css";

function OwnerReminders() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [overdue, setOverdue] = useState([]);
  const [sending, setSending] = useState(false);

  const fetchOverdue = async () => {
    try {
      const res = await api.get("/notifications/overdue-tenants");
      setOverdue(res.data.overdue || []);
    } catch (error) {
      console.error("OVERDUE FETCH ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to load overdue tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  const buildWhatsAppLink = (t) => {
    const dueDate = t.nextDueDate
      ? new Date(t.nextDueDate).toLocaleDateString("en-IN")
      : "";

    let message = `Hi ${t.tenantName}, this is a reminder from RoomSlider that your rent of ₹${t.rentAmount} for ${t.roomTitle} was due on ${dueDate}.`;

    if (t.electricityDue > 0) {
      message += ` You also have a pending electricity bill of ₹${t.electricityDue}.`;
    }

    message += ` Please pay via your Tenant Portal: https://roomslider-lyart.vercel.app/my-place`;

    const phone = (t.tenantPhone || "").replace(/\D/g, "");
    const phoneWithCountryCode = phone.startsWith("91") ? phone : `91${phone}`;

    return `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`;
  };

  const handleSendAllInApp = async () => {
    setSending(true);
    try {
      const res = await api.post("/notifications/send-reminders");
      toast.success(res.data.message);
    } catch (error) {
      console.error("SEND REMINDERS ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to send reminders");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="owner-dashboard">
        <p>Loading overdue tenants...</p>
      </div>
    );
  }

  return (
    <div className="owner-dashboard">
      <button className="owner-detail-back" onClick={() => navigate("/owner/dashboard")}>
        ← Back to Dashboard
      </button>

      <div className="owner-dashboard-top">
        <div>
          <h2>Send Reminders</h2>
          <p>{overdue.length} tenant(s) currently have overdue rent.</p>
        </div>

        {overdue.length > 0 && (
          <button
            className="owner-btn owner-btn-primary"
            onClick={handleSendAllInApp}
            disabled={sending}
          >
            <Bell size={16} />
            {sending ? "Sending..." : "Notify All (In-App)"}
          </button>
        )}
      </div>

      {overdue.length === 0 ? (
        <div className="owner-empty-state">
          <p>No overdue tenants right now. 🎉</p>
        </div>
      ) : (
        overdue.map((t) => (
          <div key={t.roomId} className="owner-reminder-item">
            <div className="owner-reminder-info">
              <strong>{t.tenantName}</strong>
              <div>{t.roomTitle}</div>
              <div className="owner-reminder-due">
                Rent due: ₹{t.rentAmount} since{" "}
                {t.nextDueDate ? new Date(t.nextDueDate).toLocaleDateString("en-IN") : "—"}
                {t.electricityDue > 0 && ` · Electricity due: ₹${t.electricityDue}`}
              </div>
            </div>

            <a
              href={buildWhatsAppLink(t)}
              target="_blank"
              rel="noopener noreferrer"
              className="owner-whatsapp-btn"
            >
              <MessageCircle size={15} />
              Send WhatsApp
            </a>
          </div>
        ))
      )}
    </div>
  );
}

export default OwnerReminders;
