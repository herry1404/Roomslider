import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, Minus, Plus, Shirt } from "lucide-react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/laundry.css";

function LaundryDetail() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [pickupAddress, setPickupAddress] = useState("");

  useEffect(() => {
    api.get(`/laundry-vendors/public/${id}`)
      .then((response) => setVendor(response.data.vendor))
      .catch((error) => toast.error(error.response?.data?.message || "Laundry profile nahi mili"))
      .finally(() => setLoading(false));
  }, [id]);

  const total = useMemo(
    () => (vendor?.catalog || []).reduce(
      (sum, item) => sum + item.price * (quantities[item._id] || 0),
      0
    ),
    [vendor, quantities]
  );

  const placeOrder = () => {
    const selected = (vendor.catalog || []).filter((item) => quantities[item._id] > 0);
    if (!selected.length) {
      toast.error("Pehle kapde select karo");
      return;
    }
    const orderLines = selected.map(
      (item) => `${item.name}: ${quantities[item._id]} × ₹${item.price} = ₹${item.price * quantities[item._id]}`
    );
    const message = [
      `Hi ${vendor.vendorName}, I would like to place a laundry order via RoomSlider.`,
      "",
      ...orderLines,
      "",
      `Estimated total: ₹${total}`,
      ...(pickupAddress.trim() ? [`Pickup/delivery address: ${pickupAddress.trim()}`] : []),
    ].join("\n");
    const number = (vendor.whatsapp || vendor.phone).replace(/\D/g, "");
    const internationalNumber = number.startsWith("91") ? number : `91${number}`;
    window.open(
      `https://wa.me/${internationalNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (loading) return <main className="container laundry-page"><p>Loading laundry profile...</p></main>;
  if (!vendor) return <main className="container laundry-page"><p>Laundry profile nahi mili.</p></main>;

  return (
    <main className="container laundry-page laundry-detail-page">
      <Helmet><title>{vendor.vendorName} | RoomSlider Laundry</title></Helmet>
      <Link className="laundry-back-link" to="/laundry"><ArrowLeft size={17} /> All laundries</Link>

      <header className="laundry-profile-header">
        <div className="laundry-vendor-icon large"><Shirt size={28} /></div>
        <div>
          <h1>{vendor.vendorName}</h1>
          <p><MapPin size={15} />{[vendor.area, vendor.address].filter(Boolean).join(", ")}</p>
          <a href={`tel:${vendor.phone}`}>{vendor.phone}</a>
        </div>
      </header>

      <section className="laundry-order-card">
        <div className="laundry-order-heading">
          <div><h2>Select clothes</h2><p>Vendor prices are shown before you send your order.</p></div>
          <strong>{vendor.catalog.length} items</strong>
        </div>
        <div className="laundry-customer-catalog">
          {vendor.catalog.map((item) => {
            const quantity = quantities[item._id] || 0;
            return (
              <article className="laundry-catalog-item" key={item._id}>
                <div><strong>{item.name}</strong><span>₹{item.price} / piece</span></div>
                <div className="laundry-quantity">
                  <button type="button" aria-label={`Remove one ${item.name}`} disabled={!quantity} onClick={() => setQuantities((current) => ({ ...current, [item._id]: Math.max(0, quantity - 1) }))}><Minus size={15} /></button>
                  <span>{quantity}</span>
                  <button type="button" aria-label={`Add one ${item.name}`} onClick={() => setQuantities((current) => ({ ...current, [item._id]: quantity + 1 }))}><Plus size={15} /></button>
                </div>
              </article>
            );
          })}
        </div>
        <label className="laundry-address-field">
          Pickup / delivery address (optional)
          <input value={pickupAddress} onChange={(event) => setPickupAddress(event.target.value)} placeholder="Enter your pickup address" maxLength={200} />
        </label>
        <footer className="laundry-order-footer">
          <div><span>Estimated total</span><strong>₹{total}</strong></div>
          <button type="button" onClick={placeOrder}><MessageCircle size={18} /> Send order on WhatsApp</button>
        </footer>
        <p className="laundry-order-disclaimer">Final pickup, delivery, and price confirmation happens directly with the laundry on WhatsApp.</p>
      </section>
    </main>
  );
}

export default LaundryDetail;
