import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Printer } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "../../styles/hourly-receipt.css";

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

function HourlyBookingReceipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    api.get(`/hourly-bookings/${id}/receipt`)
      .then((response) => setReceipt(response.data.receipt))
      .catch((error) => {
        toast.error(error.response?.data?.message || "Receipt load nahi hui");
      })
      .finally(() => setLoading(false));
  }, [id, navigate, user]);

  if (loading) return <main className="hourly-receipt-page">Loading receipt...</main>;
  if (!receipt) {
    return (
      <main className="hourly-receipt-page">
        <p>Receipt available nahi hai.</p>
        <button type="button" onClick={() => navigate(-1)}>Go back</button>
      </main>
    );
  }

  return (
    <main className="hourly-receipt-page">
      <article className="hourly-receipt">
        <header className="hourly-receipt-header">
          <div>
            <p className="hourly-receipt-brand">ROOMSLIDER</p>
            <h1>Hourly room receipt</h1>
          </div>
          <CheckCircle2 size={36} aria-label="Payment successful" />
        </header>

        <p className="hourly-receipt-paid">Payment {receipt.paymentStatus}</p>
        <p className="hourly-receipt-id">Booking ID: {receipt.bookingId}</p>

        <dl>
          <div><dt>Guest</dt><dd>{receipt.guestName}</dd></div>
          {receipt.guestPhone && <div><dt>Phone</dt><dd>{receipt.guestPhone}</dd></div>}
          <div><dt>Room</dt><dd>{receipt.room?.title || "Hourly room"}</dd></div>
          <div><dt>Location</dt><dd>{[receipt.room?.location?.address, receipt.room?.location?.city].filter(Boolean).join(", ") || "—"}</dd></div>
          <div><dt>Check-in</dt><dd>{formatDateTime(receipt.bookedFrom)}</dd></div>
          <div><dt>Check-out</dt><dd>{formatDateTime(receipt.bookedTo)}</dd></div>
          <div><dt>Paid at</dt><dd>{formatDateTime(receipt.paidAt)}</dd></div>
          <div><dt>Booking status</dt><dd>{receipt.status}</dd></div>
          <div><dt>Payment ID</dt><dd>{receipt.paymentId || "—"}</dd></div>
        </dl>

        <div className="hourly-receipt-total">
          <span>Amount paid</span>
          <strong>₹{Number(receipt.amount).toLocaleString("en-IN")}</strong>
        </div>
        <p className="hourly-receipt-note">
          Keep this receipt for your records. Payment was processed securely by Razorpay.
        </p>
        <button className="hourly-receipt-print" type="button" onClick={() => window.print()}>
          <Printer size={17} />
          Print receipt
        </button>
      </article>
    </main>
  );
}

export default HourlyBookingReceipt;
