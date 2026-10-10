import { Phone } from "lucide-react";
import { requestLogin } from "../../utils/loginPrompt";

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
        ? <button className="pd-mobile-call" type="button" onClick={() => requestLogin("Log in to contact the owner")}><Phone size={17} /> Contact</button>
        : <button className="pd-mobile-call" type="button" onClick={onCall}><Phone size={17} /> Call</button>)}
      {showWhatsApp && (loginHref
        ? <button className="pd-mobile-whatsapp" type="button" onClick={() => requestLogin("Log in to contact the owner on WhatsApp")} aria-label="Log in to contact on WhatsApp">WA</button>
        : <button className="pd-mobile-whatsapp" type="button" onClick={onWhatsApp} aria-label="Contact on WhatsApp">WA</button>)}
    </div>
  );
}

export default MobileContactBar;
