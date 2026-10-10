import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, MapPin, ShieldCheck, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { loadRazorpay } from "../../utils/loadRazorpay";
import SEO, { SITE_URL } from "../../components/SEO";
import "../../styles/hourly-detail.css";

function toLocalInputValue(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const defaultStart = new Date();
defaultStart.setMinutes(defaultStart.getMinutes() + 30);
const defaultEnd = new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000);

function HourlyRoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [form, setForm] = useState({
    guestName: "",
    guestPhone: "",
    idProofType: "",
    idProofNumber: "",
    bookedFrom: toLocalInputValue(defaultStart),
    bookedTo: toLocalInputValue(defaultEnd),
  });
  const [idPhoto, setIdPhoto] = useState(null);
  const [checking, setChecking] = useState(false);
  const [quote, setQuote] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    api.get(`/hourly-rooms/public/${id}`)
      .then(({ data }) => {
        if (active) setRoom(data);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error.response?.data?.message || "Room could not be loaded");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const updateForm = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setQuote(null);
  };

  const checkAvailability = async (event) => {
    event.preventDefault();
    if (!room || !form.bookedFrom || !form.bookedTo) return;
    if (new Date(form.bookedFrom) >= new Date(form.bookedTo)) {
      toast.error("End time start time ke baad honi chahiye");
      return;
    }

    try {
      setChecking(true);
      setQuote(null);
      const response = await api.get("/hourly-bookings/check-availability", {
        params: {
          roomId: room._id,
          from: new Date(form.bookedFrom).toISOString(),
          to: new Date(form.bookedTo).toISOString(),
        },
      });
      setQuote(response.data);
      if (!response.data.available) toast.error("Ye time slot available nahi hai");
    } catch (error) {
      toast.error(error.response?.data?.message || "Availability check fail");
    } finally {
      setChecking(false);
    }
  };

  const payAndBook = async (event) => {
    event.preventDefault();
    if (!form.guestName.trim() || !form.guestPhone.trim() || !form.idProofType || !form.idProofNumber.trim()) {
      toast.error("Sab details bharna zaroori hai");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.guestPhone)) {
      toast.error("Sahi 10 digit phone number daalo");
      return;
    }
    if (!idPhoto) {
      toast.error("ID photo upload karna zaroori hai");
      return;
    }
    if (!quote?.available || submitting) return;

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

      const orderResponse = await api.post("/hourly-bookings/create-order", data);
      const { bookingId, orderId, amount, currency, key } = orderResponse.data;
      await loadRazorpay();
      const checkout = new window.Razorpay({
        key,
        amount,
        currency,
        order_id: orderId,
        name: "RoomSlider",
        description: `${room.title} - Hourly Booking`,
        handler: async (payment) => {
          try {
            const verification = await api.post("/hourly-bookings/verify-payment", {
              bookingId,
              razorpay_order_id: payment.razorpay_order_id,
              razorpay_payment_id: payment.razorpay_payment_id,
              razorpay_signature: payment.razorpay_signature,
            });
            toast.success("Booking confirmed!");
            if (verification.data.notificationWarning) toast.error(verification.data.notificationWarning);
            navigate(`/hourly-bookings/${bookingId}/receipt`);
          } catch (error) {
            toast.error(error.response?.data?.message || "Payment verify nahi hua. Support se contact karo.");
            setSubmitting(false);
          }
        },
        modal: { ondismiss: () => setSubmitting(false) },
        theme: { color: "#10B981" },
      });
      checkout.on("payment.failed", (failure) => {
        toast.error(failure.error?.description || "Payment failed");
        setSubmitting(false);
      });
      checkout.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking start nahi ho payi");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="container hourly-detail-page"><p>Loading room...</p></main>;
  }

  if (!room) {
    return (
      <main className="container hourly-detail-page">
        <section className="hourly-detail-empty">
          <h1>Room not found</h1>
          <Link to="/hourly-rooms">Back to hourly rooms</Link>
        </section>
      </main>
    );
  }
  if (room.slug && id !== room.slug) return <Navigate to={`/hourly-rooms/${room.slug}`} replace />;

  const location = [room.location?.address, room.location?.city].filter(Boolean).join(", ");
  const price = Number(room.pricePerHour);
  const detailPath = `/hourly-rooms/${room.slug || id}`;
  const description = `${room.title} in ${location || "Indore"} for ₹${price}/hour. View photos, facilities and availability, then reserve this short stay directly on RoomSlider.`;

  return (
    <main className="container hourly-detail-page">
      <SEO
        title={`${room.title} in ${location || "Indore"} | Short Stay | RoomSlider`}
        description={description}
        path={detailPath}
        image={room.images?.[0]}
        type="product"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Short Stays in Indore", path: "/hourly-rooms" },
          { name: room.title, path: detailPath },
        ]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Accommodation",
          name: room.title,
          description,
          url: `${SITE_URL}${detailPath}`,
          ...(room.images?.[0] ? { image: room.images[0] } : {}),
          address: {
            "@type": "PostalAddress",
            addressLocality: room.location?.city || "Indore",
            addressRegion: "Madhya Pradesh",
            addressCountry: "IN",
          },
          ...(Number.isFinite(price) && price > 0 ? { priceRange: `₹${price} per hour` } : {}),
        }}
      />

      <button type="button" className="hourly-detail-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Back
      </button>

      <header className="hourly-detail-heading">
        <h1>{room.title}</h1>
        {location && <p><MapPin size={16} aria-hidden="true" /> {location}</p>}
      </header>

      <div className="hourly-detail-layout">
        <article className="hourly-detail-main">
          {room.images?.[0] ? (
            <img className="hourly-detail-image" src={optimizeCloudinaryImage(room.images[0], 1600)} alt={`${room.title} short stay in ${location || "Indore"}`} width="1600" height="1200" loading="eager" />
          ) : (
            <div className="hourly-detail-image hourly-detail-image-placeholder" role="img" aria-label="No room photo available" />
          )}
          {room.description && (
            <section className="hourly-detail-section">
              <h2>About this room</h2>
              <p>{room.description}</p>
            </section>
          )}
          {room.amenities?.length > 0 && (
            <section className="hourly-detail-section">
              <h2>What this place offers</h2>
              <ul className="hourly-detail-amenities">
                {room.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}
              </ul>
            </section>
          )}
        </article>

        <form
          className="hourly-detail-booking"
          onSubmit={(event) => {
            if (quote?.available) {
              event.preventDefault();
              return;
            }
            checkAvailability(event);
          }}
        >
          {!bookingOpen ? (
            <>
              {Number.isFinite(price) && price > 0 && (
                <p className="hourly-detail-price">
                  <strong>₹{price.toLocaleString("en-IN")}</strong>
                  <span><Clock3 size={15} aria-hidden="true" /> / hour</span>
                </p>
              )}
              <p className="hourly-detail-booking-note">Choose your time to check availability and book this room.</p>
              <button className="hourly-detail-book-button" type="button" onClick={() => setBookingOpen(true)}>
                Check availability
              </button>
            </>
          ) : (
            <>
              <div className="hourly-detail-booking-heading">
                <h2>Choose your time</h2>
                <button type="button" onClick={() => { setBookingOpen(false); setQuote(null); }}>
                  Back
                </button>
              </div>
              <p className="hourly-detail-price">
                <strong>₹{price.toLocaleString("en-IN")}</strong>
                <span><Clock3 size={15} aria-hidden="true" /> / hour</span>
              </p>
              <label className="hourly-detail-field">
                Check-in
                <input type="datetime-local" required value={form.bookedFrom} onChange={updateForm("bookedFrom")} />
              </label>
              <label className="hourly-detail-field">
                Check-out
                <input type="datetime-local" required value={form.bookedTo} onChange={updateForm("bookedTo")} />
              </label>
              <button className="hourly-detail-book-button" type="submit" disabled={checking}>
                {checking ? "Checking..." : "Check availability"}
              </button>
              {quote && (
                <div className={`hourly-detail-availability ${quote.available ? "available" : "unavailable"}`} role="status">
                  {quote.available
                    ? `Available · ${quote.hours.toFixed(1)} hours`
                    : "This time slot is unavailable. Choose another time."}
                </div>
              )}
              {quote?.available && (
                <>
                  <div className="hourly-detail-estimate">
                    <span>{quote.hours.toFixed(1)} hours</span>
                    <strong>₹{Number(quote.amount).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="hourly-detail-guest-heading">
                    <UserRound size={18} aria-hidden="true" />
                    <div><h2>Guest details</h2><p>Required for this reservation.</p></div>
                  </div>
                  <label className="hourly-detail-field">
                    Full name
                    <input autoComplete="name" placeholder="Your full name" required value={form.guestName} onChange={updateForm("guestName")} />
                  </label>
                  <label className="hourly-detail-field">
                    Phone number
                    <input autoComplete="tel" inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" required value={form.guestPhone} onChange={updateForm("guestPhone")} />
                  </label>
                  <label className="hourly-detail-field">
                    ID type
                    <select required value={form.idProofType} onChange={updateForm("idProofType")}>
                      <option value="">Select ID type</option>
                      <option value="aadhaar">Aadhaar</option>
                      <option value="voter_id">Voter ID</option>
                      <option value="driving_license">Driving License</option>
                      <option value="college_id">College ID</option>
                    </select>
                  </label>
                  <label className="hourly-detail-field">
                    ID number
                    <input required placeholder="Enter ID number" value={form.idProofNumber} onChange={updateForm("idProofNumber")} />
                  </label>
                  <label className="hourly-detail-field">
                    Upload ID photo
                    <input type="file" required accept="image/*" onChange={(event) => setIdPhoto(event.target.files?.[0] || null)} />
                    {idPhoto && <small>{idPhoto.name}</small>}
                  </label>
                  <p className="hourly-detail-secure-note"><ShieldCheck size={16} /> Payment is secure. Your booking is confirmed after payment.</p>
                  <button className="hourly-detail-book-button" type="button" disabled={submitting} onClick={payAndBook}>
                    {submitting ? "Opening payment..." : `Pay ₹${Number(quote.amount).toLocaleString("en-IN")} & Book`}
                  </button>
                </>
              )}
            </>
          )}
        </form>
      </div>
    </main>
  );
}

export default HourlyRoomDetail;
