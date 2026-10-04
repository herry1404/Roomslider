import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { MapPin, CheckCircle2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import NearbyVillas from "../../components/home/NearbyVillas";
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
  const [bookingOpen, setBookingOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [form, setForm] = useState({
    bookingType: "stay",
    startDate: tomorrowValue,
    endDate: dayAfterValue,
    guestCount: "2",
  });

  useEffect(() => {
    let active = true;
    api.get(`/villas/public/${id}`)
      .then((response) => {
        if (!active) return;
        setVilla(response.data.villa);
        setActiveImage(0);
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || "Villa nahi mili");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
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
          villaId: villa._id,
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
        villaId: villa._id,
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
  if (villa.slug && id !== villa.slug) return <Navigate to={`/villas/${villa.slug}`} replace />;

  const images = (villa.images || []).filter(Boolean);
  const coordinates = villa.location?.coordinates || [];
  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);
  const mapsUrl = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([villa.address, villa.area, villa.city].filter(Boolean).join(", "))}`;
  const location = [villa.address, villa.area, villa.city].filter(Boolean).join(", ");

  return (
    <main className="container villa-detail-page">
      <Helmet>
        <title>{villa.name} | {villa.area}, {villa.city} | RoomSlider</title>
        <meta name="description" content={`${villa.name} in ${villa.area}, ${villa.city}. View photos, amenities, guest capacity and real rates before booking.`} />
      </Helmet>
      <div className="villa-detail-top">
        <h1>{villa.name}</h1>
        <p><MapPin size={16} aria-hidden="true" />{location}</p>
      </div>

      <section className={`villa-detail-gallery${images.length <= 1 ? " villa-detail-gallery-single" : ""}`} aria-label={`${villa.name} photos`}>
        {images.length ? (
          <>
            <div className="villa-detail-gallery-main">
              <img src={optimizeCloudinaryImage(images[activeImage], 1600)} alt={`${villa.name}, photo ${activeImage + 1}`} loading="eager" />
            </div>
            {images.length > 1 && (
              <div className="villa-detail-gallery-thumbnails">
                {images.map((image, index) => (
                  <button
                    type="button"
                    className={activeImage === index ? "active" : ""}
                    key={`${image}-${index}`}
                    onClick={() => setActiveImage(index)}
                    aria-label={`Show villa photo ${index + 1}`}
                    aria-pressed={activeImage === index}
                  >
                    <img src={optimizeCloudinaryImage(image, 640)} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="villa-detail-gallery-placeholder" role="img" aria-label="No villa photos available">
            Photos are not available yet
          </div>
        )}
      </section>

      <div className="villa-detail-grid">
        <article className="villa-detail-main">
          <div className="villa-detail-summary">
            <div>
              <h2>{villa.name}</h2>
              <p>{[
                villa.maxGuests != null && `Up to ${villa.maxGuests} guests`,
                villa.bedrooms != null && `${villa.bedrooms} bedrooms`,
                villa.bathrooms != null && `${villa.bathrooms} bathrooms`,
              ].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          {villa.description && (
            <section className="villa-detail-section">
              <h2>About this place</h2>
              <p className="villa-description">{villa.description}</p>
            </section>
          )}
          {villa.amenities?.length > 0 && (
            <section className="villa-detail-section">
              <h2>What this place offers</h2>
              <ul className="villa-amenities">{villa.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul>
            </section>
          )}
          <section className="villa-detail-section">
            <h2>Where you&apos;ll be</h2>
            <p className="villa-address"><MapPin size={16} aria-hidden="true" />{location}</p>
            <a className="villa-map-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">
              View location on map
            </a>
          </section>
          <section className="villa-detail-section villa-detail-rates">
            <h2>Rates</h2>
            {villa.nightlyRate != null && <p><span>Overnight stay</span><strong>₹{Number(villa.nightlyRate).toLocaleString("en-IN")} / night</strong></p>}
            {villa.eventRate != null && <p><span>Party or event</span><strong>₹{Number(villa.eventRate).toLocaleString("en-IN")} / day</strong></p>}
          </section>
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
              {!bookingOpen ? (
                <>
                  <div className="villa-booking-preview">
                    <span><strong>₹{Number(villa.nightlyRate).toLocaleString("en-IN")}</strong> / night</span>
                    <small>Event booking also available</small>
                  </div>
                  <button type="button" className="villa-check-btn" onClick={() => setBookingOpen(true)}>
                    Check availability
                  </button>
                  <small className="villa-booking-hint">Choose dates and guest count before you book.</small>
                </>
              ) : (
                <>
                  <div className="villa-booking-form-heading">
                    <h2>Choose dates</h2>
                    <button type="button" onClick={() => { setBookingOpen(false); setQuote(null); }}>Back to details</button>
                  </div>
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
            </>
          )}
        </form>
      </div>
      <NearbyVillas villa={villa} />
    </main>
  );
}

export default VillaDetail;
