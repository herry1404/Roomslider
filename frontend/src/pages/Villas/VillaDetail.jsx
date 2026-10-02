import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BedDouble, MapPin, Users, CheckCircle2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "../../styles/villas.css";

const localDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowValue = localDate(tomorrow);
const dayAfterValue = localDate(new Date(tomorrow.getTime() + 86400000));

function VillaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [villa, setVilla] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [form, setForm] = useState({
    bookingType: "stay",
    startDate: tomorrowValue,
    endDate: dayAfterValue,
    guestCount: "2",
  });

  useEffect(() => {
    api.get(`/villas/public/${id}`)
      .then((response) => setVilla(response.data.villa))
      .catch((error) => toast.error(error.response?.data?.message || "Villa nahi mili"))
      .finally(() => setLoading(false));
  }, [id]);

  const updateForm = (key, value) => {
    setQuote(null);
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "bookingType" && value === "event"
        ? { endDate: current.startDate }
        : key === "bookingType" && value === "stay" && current.endDate === current.startDate
        ? { endDate: localDate(new Date(new Date(current.startDate).getTime() + 86400000)) }
        : key === "startDate" && current.bookingType === "event"
        ? { endDate: value }
        : {}),
    }));
  };

  const checkAvailability = async (event) => {
    event.preventDefault();
    try {
      setChecking(true);
      setQuote(null);
      const response = await api.get("/villa-bookings/check-availability", {
        params: {
          villaId: id,
          bookingType: form.bookingType,
          startDate: form.startDate,
          endDate: form.endDate,
          guestCount: form.guestCount,
        },
      });
      setQuote(response.data);
      if (!response.data.available) toast.error("These dates are already booked");
    } catch (error) {
      toast.error(error.response?.data?.message || "Availability check nahi ho paya");
    } finally {
      setChecking(false);
    }
  };

  const payAndBook = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!quote?.available || submitting) return;

    try {
      setSubmitting(true);
      const orderResponse = await api.post("/villa-bookings/create-order", {
        villaId: id,
        bookingType: form.bookingType,
        startDate: form.startDate,
        endDate: form.endDate,
        guestCount: Number(form.guestCount),
      });
      const { bookingId, orderId, amount, currency, key } = orderResponse.data;

      const checkout = new window.Razorpay({
        key,
        amount,
        currency,
        order_id: orderId,
        name: "RoomSlider",
        description: `${villa.name} - ${form.bookingType === "event" ? "Event" : "Stay"}`,
        handler: async (payment) => {
          try {
            await api.post("/villa-bookings/verify-payment", {
              bookingId,
              razorpay_order_id: payment.razorpay_order_id,
              razorpay_payment_id: payment.razorpay_payment_id,
              razorpay_signature: payment.razorpay_signature,
            });
            setConfirmed(true);
            setQuote(null);
            toast.success("Villa reservation confirmed!");
          } catch (error) {
            toast.error(error.response?.data?.message || "Payment verify nahi hua; support se contact karein");
          } finally {
            setSubmitting(false);
          }
        },
        modal: { ondismiss: () => setSubmitting(false) },
        theme: { color: "#16a34a" },
      });
      checkout.on("payment.failed", (failure) => {
        toast.error(failure.error?.description || "Payment failed");
        setSubmitting(false);
      });
      checkout.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking payment start nahi ho paya");
      setSubmitting(false);
    }
  };

  if (loading) return <main className="container villa-detail-page">Loading villa...</main>;
  if (!villa) return <main className="container villa-detail-page"><div className="villa-empty">Villa nahi mili.</div></main>;

  return (
    <main className="container villa-detail-page">
      <Helmet><title>{villa.name} | Book a Villa | RoomSlider</title></Helmet>
      <div className="villa-detail-grid">
        <article className="villa-detail-main">
          {villa.images?.[0] && <img className="villa-hero-image" src={villa.images[0]} alt={villa.name} />}
          <h1>{villa.name}</h1>
          <p className="villa-address"><MapPin size={16} />{villa.address}, {villa.area}, {villa.city}</p>
          <div className="villa-card-meta">
            <span><Users size={15} /> Up to {villa.maxGuests} guests</span>
            <span><BedDouble size={15} /> {villa.bedrooms} bedrooms · {villa.bathrooms} bathrooms</span>
          </div>
          <p className="villa-description">{villa.description}</p>
          {villa.amenities?.length > 0 && <ul className="villa-amenities">{villa.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul>}
          <div className="villa-rates-panel">
            <div><span>Overnight stay</span><strong>₹{Number(villa.nightlyRate).toLocaleString("en-IN")} / night</strong></div>
            <div><span>Party / event</span><strong>₹{Number(villa.eventRate).toLocaleString("en-IN")} / day</strong></div>
          </div>
        </article>

        <form className="villa-booking-panel" onSubmit={checkAvailability}>
          {confirmed ? (
            <>
              <CheckCircle2 size={34} color="var(--color-primary)" />
              <h2>Booking confirmed</h2>
              <p>Payment received. Your villa reservation is confirmed. You can check booking details in your profile activity.</p>
              <button type="button" className="villa-check-btn" onClick={() => navigate("/profile")}>Go to profile</button>
            </>
          ) : (
            <>
              <h2>Book this villa</h2>
              <div className="villa-booking-type">
                <button type="button" className={form.bookingType === "stay" ? "active" : ""} onClick={() => updateForm("bookingType", "stay")}>Overnight stay</button>
                <button type="button" className={form.bookingType === "event" ? "active" : ""} onClick={() => updateForm("bookingType", "event")}>Party / event</button>
              </div>
              <label>{form.bookingType === "event" ? "Event date" : "Check-in"}
                <input type="date" min={tomorrowValue} required value={form.startDate} onChange={(event) => updateForm("startDate", event.target.value)} />
              </label>
              <label>{form.bookingType === "event" ? "Event end date" : "Check-out"}
                <input type="date" min={form.bookingType === "stay" ? localDate(new Date(new Date(form.startDate).getTime() + 86400000)) : form.startDate} required value={form.endDate} onChange={(event) => updateForm("endDate", event.target.value)} />
              </label>
              <label>Number of guests
                <input type="number" min="1" max={villa.maxGuests} required value={form.guestCount} onChange={(event) => updateForm("guestCount", event.target.value)} />
              </label>
              <button className="villa-check-btn" type="submit" disabled={checking}>{checking ? "Checking..." : "Check availability"}</button>
              {quote && <div className={`villa-availability ${quote.available ? "available" : "unavailable"}`}>{quote.available ? `Available · ${quote.dayCount} ${quote.dayCount === 1 ? "day" : "days"}` : "Unavailable for these dates"}</div>}
              {quote?.available && <>
                <div className="villa-booking-estimate"><span>{quote.dayCount} × ₹{quote.rate} {form.bookingType === "event" ? "/ event day" : "/ night"}</span><strong>₹{quote.amount.toLocaleString("en-IN")}</strong></div>
                <button type="button" className="villa-pay-btn" disabled={submitting} onClick={payAndBook}>{submitting ? "Opening payment..." : `Pay ₹${quote.amount.toLocaleString("en-IN")} & Book`}</button>
                {!user && <small>Login is required to make a reservation.</small>}
              </>}
            </>
          )}
        </form>
      </div>
    </main>
  );
}

export default VillaDetail;
