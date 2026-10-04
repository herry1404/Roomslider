import { Link } from "react-router-dom";
import { Phone } from "lucide-react";

function ContactCard({ price, deposit, ownerName, showCall, showWhatsApp, loginHref, onCall, onWhatsApp }) {
  if (!showCall && !showWhatsApp) return null;

  return (
    <aside className="pd-contact-card" aria-label="Contact the owner">
      {price != null && (
        <p className="pd-contact-price">
          <strong>₹{Number(price).toLocaleString("en-IN")}</strong>
          <span>/ month</span>
        </p>
      )}
      {deposit > 0 && <p className="pd-contact-deposit">Deposit ₹{Number(deposit).toLocaleString("en-IN")}</p>}
      {showCall && (loginHref
        ? <Link className="pd-contact-call" to={loginHref} state={{ from: window.location.pathname }}><Phone size={18} /> Log in to contact</Link>
        : <button className="pd-contact-call" type="button" onClick={onCall}><Phone size={18} /> Call owner</button>)}
      {showWhatsApp && (loginHref
        ? <Link className="pd-contact-whatsapp" to={loginHref} state={{ from: window.location.pathname }}>Log in for WhatsApp</Link>
        : <button className="pd-contact-whatsapp" type="button" onClick={onWhatsApp}>WhatsApp</button>)}
      {ownerName && <p className="pd-contact-owner">Contact {ownerName} directly.</p>}
      <p className="pd-contact-note">You won&apos;t be charged. Contact the owner directly.</p>
    </aside>
  );
}

export default ContactCard;
