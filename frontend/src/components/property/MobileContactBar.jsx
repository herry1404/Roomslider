import { Link } from "react-router-dom";
import { Phone } from "lucide-react";

function MobileContactBar({ price, showCall, showWhatsApp, loginHref, onCall, onWhatsApp }) {
  if (!showCall && !showWhatsApp) return null;

  return (
    <div className="pd-mobile-contact-bar" aria-label="Contact the owner">
      {price != null && (
        <div className="pd-mobile-price">
          <strong>₹{Number(price).toLocaleString("en-IN")}</strong>
          <span>/ month</span>
        </div>
      )}
      {showCall && (loginHref
        ? <Link className="pd-mobile-call" to={loginHref} state={{ from: window.location.pathname }}><Phone size={17} /> Contact</Link>
        : <button className="pd-mobile-call" type="button" onClick={onCall}><Phone size={17} /> Call</button>)}
      {showWhatsApp && (loginHref
        ? <Link className="pd-mobile-whatsapp" to={loginHref} state={{ from: window.location.pathname }} aria-label="Log in to contact on WhatsApp">WA</Link>
        : <button className="pd-mobile-whatsapp" type="button" onClick={onWhatsApp} aria-label="Contact on WhatsApp">WA</button>)}
    </div>
  );
}

export default MobileContactBar;
