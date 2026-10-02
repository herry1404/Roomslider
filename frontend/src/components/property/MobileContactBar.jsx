import { Link } from "react-router-dom";
import { Phone } from "lucide-react";

function MobileContactBar({ price, callHref, whatsappHref, loginHref }) {
  if (!callHref && !whatsappHref && !loginHref) return null;

  return (
    <div className="pd-mobile-contact-bar" aria-label="Contact the owner">
      {price != null && (
        <div className="pd-mobile-price">
          <strong>₹{Number(price).toLocaleString("en-IN")}</strong>
          <span>/ month</span>
        </div>
      )}
      {callHref ? (
        <a className="pd-mobile-call" href={callHref}><Phone size={17} /> Call</a>
      ) : loginHref ? (
        <Link className="pd-mobile-call" to={loginHref} state={{ from: window.location.pathname }}><Phone size={17} /> Contact</Link>
      ) : null}
      {whatsappHref && (
        <a className="pd-mobile-whatsapp" href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Contact on WhatsApp">
          WA
        </a>
      )}
    </div>
  );
}

export default MobileContactBar;
