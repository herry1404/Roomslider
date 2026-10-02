import { Link } from "react-router-dom";
import { Phone } from "lucide-react";

function ContactCard({ price, deposit, ownerName, callHref, whatsappHref, loginHref }) {
  if (!callHref && !whatsappHref && !loginHref) return null;

  return (
    <aside className="pd-contact-card" aria-label="Contact the owner">
      {price != null && (
        <p className="pd-contact-price">
          <strong>₹{Number(price).toLocaleString("en-IN")}</strong>
          <span>/ month</span>
        </p>
      )}
      {deposit > 0 && <p className="pd-contact-deposit">Deposit ₹{Number(deposit).toLocaleString("en-IN")}</p>}
      {callHref ? (
        <a className="pd-contact-call" href={callHref}><Phone size={18} /> Call owner</a>
      ) : loginHref ? (
        <Link className="pd-contact-call" to={loginHref} state={{ from: window.location.pathname }}><Phone size={18} /> Log in to contact</Link>
      ) : null}
      {whatsappHref && <a className="pd-contact-whatsapp" href={whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
      {ownerName && <p className="pd-contact-owner">Contact {ownerName} directly.</p>}
      <p className="pd-contact-note">You won&apos;t be charged. Contact the owner directly.</p>
    </aside>
  );
}

export default ContactCard;
