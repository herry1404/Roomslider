import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, IndianRupee, Clock, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/hourly-checkout.css";

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function HourlyRoomCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date(Date.now() + 30 * 60 * 1000);
  const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const [form, setForm] = useState({
    guestName: "",
    guestPhone: "",
    idProofType: "",
    idProofNumber: "",
    bookedFrom: toLocalInputValue(now),
    bookedTo: toLocalInputValue(later),
  });
  const [idPhoto, setIdPhoto] = useState(null);
  const [checking, setChecking] = useState(false);
  const [quote, setQuote] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await api.get(`/hourly-rooms/public/${id}`);
        setRoom(res.data);
      } catch (error) {
        toast.error("Room not found");
        navigate("/hourly-rooms");
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id, navigate]);

  const update = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setQuote(null);
  };

  const checkAvailability = async () => {
    if (!form.bookedFrom || !form.bookedTo) return;
    try {
      setChecking(true);
      setQuote(null);
      const res = await api.get("/hourly-bookings/check-availability", {
        params: {
          roomId: room._id,
          from: new Date(form.bookedFrom).toISOString(),
          to: new Date(form.bookedTo).toISOString(),
        },
      });
      setQuote(res.data);
      if (!res.data.available) {
        toast.error("Ye time slot available nahi hai");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Availability check fail");
    } finally {
      setChecking(false);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();

    if (!form.guestName.trim() || !form.guestPhone.trim() || !form.idProofType || !form.idProofNumber.trim()) {
      return toast.error("Sab details bharna zaroori hai");
    }
    if (!/^[6-9]\d{9}$/.test(form.guestPhone)) {
      return toast.error("Sahi 10 digit phone number daalo");
    }
    if (!idPhoto) {
      return toast.error("ID photo upload karna zaroori hai");
    }
    if (new Date(form.bookedFrom) >= new Date(form.bookedTo)) {
      return toast.error("End time start time ke baad honi chahiye");
    }
    if (!quote || !quote.available) {
      return toast.error("Pehle availability check karo");
    }

    try {
      setSubmitting(true);

      const data = new FormData();
      data.append("roomId", room._id);
      data.append("guestName", form.guestName);
      data.append("guestPhone", form.guestPhone);
      data.append("idProofType", form.idProofType);
      data.append("idProofNumber", form.idProofNumber);
      data.append("bookedFrom", new Date(form.bookedFrom).toISOString());
      data.append("bookedTo", new Date(form.bookedTo).toISOString());
      data.append("idProofPhoto", idPhoto);

      const orderRes = await api.post("/hourly-bookings/create-order", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { bookingId, orderId, amount, currency, key } = orderRes.data;

      const options = {
        key,
        amount,
        currency,
        order_id: orderId,
        name: "RoomSlider",
        description: `${room.title} - Hourly Booking`,
        handler: async (response) => {
          try {
            const verification = await api.post("/hourly-bookings/verify-payment", {
              bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Booking confirmed!");
            if (verification.data.notificationWarning) {
              toast.error(verification.data.notificationWarning);
            }
            navigate(`/hourly-bookings/${bookingId}/receipt`);
          } catch (verifyError) {
            toast.error(
              verifyError.response?.data?.message || "Payment verify nahi hua. Support se contact karo."
            );
          }
        },
        theme: { color: "#2563EB" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking start nahi ho payi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="hc-page hc-loading">Loading...</div>;
  }

  if (!room) return null;

  return (
    <div className="hc-page">
      <header className="hc-topbar">
        <button className="hc-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>Confirm & Pay</h1>
      </header>

      <div className="hc-content">
        <section className="hc-room-summary">
          <img src={room.images?.[0]} alt={room.title} />
          <div className="hc-room-info">
            <h2>{room.title}</h2>
            <p className="hc-muted">
              <MapPin size={14} /> {room.location?.address}, {room.location?.city}
            </p>
            <p className="hc-price">
              <IndianRupee size={15} />
              {room.pricePerHour}
              <span className="hc-muted"> /hour</span>
            </p>
          </div>
        </section>

        <section className="hc-block">
          <h3>Booking Time</h3>
          <div className="hc-row-2">
            <label>
              From
              <input type="datetime-local" required value={form.bookedFrom} onChange={update("bookedFrom")} />
            </label>
            <label>
              To
              <input type="datetime-local" required value={form.bookedTo} onChange={update("bookedTo")} />
            </label>
          </div>
          <button type="button" className="hc-check-btn" onClick={checkAvailability} disabled={checking}>
            {checking ? "Checking..." : "Check Availability"}
          </button>

          {quote && (
            <div className={`hc-quote ${quote.available ? "ok" : "bad"}`}>
              {quote.available
                ? `Available for ${quote.hours.toFixed(1)} hrs`
                : "Not available for this time"}
            </div>
          )}
        </section>

        <section className="hc-block">
          <h3>Guest Details</h3>
          <input placeholder="Full name" required value={form.guestName} onChange={update("guestName")} />
          <input placeholder="Phone number" required value={form.guestPhone} onChange={update("guestPhone")} />
          <select required value={form.idProofType} onChange={update("idProofType")}>
            <option value="">Select ID type</option>
            <option value="aadhaar">Aadhaar</option>
            <option value="voter_id">Voter ID</option>
            <option value="driving_license">Driving License</option>
            <option value="college_id">College ID</option>
          </select>
          <input placeholder="ID number" required value={form.idProofNumber} onChange={update("idProofNumber")} />
          <label className="hc-file-label">
            Upload ID photo
            <input type="file" required accept="image/*" onChange={(e) => setIdPhoto(e.target.files[0])} />
          </label>
        </section>

        {quote?.available && (
          <section className="hc-block hc-summary-block">
            <h3>Price Details</h3>
            <div className="hc-line">
              <span>Room charges ({quote.hours.toFixed(1)} hrs)</span>
              <span>₹{quote.amount}</span>
            </div>
            <div className="hc-line hc-total">
              <span>Amount Payable</span>
              <span>₹{quote.amount}</span>
            </div>
          </section>
        )}

        <p className="hc-cancel-note">
          <ShieldCheck size={14} /> Free cancellation up to 1 hour before start time (10% fee applies, 90% refunded)
        </p>
      </div>

      <div className="hc-footer">
        <div className="hc-footer-amount">
          <span className="hc-muted">Total</span>
          <strong>{quote?.available ? `₹${quote.amount}` : "—"}</strong>
        </div>
        <button className="hc-pay-btn" onClick={handlePay} disabled={submitting || !quote?.available}>
          {submitting ? "Processing..." : "Pay & Book"}
        </button>
      </div>
    </div>
  );
}

export default HourlyRoomCheckout;
