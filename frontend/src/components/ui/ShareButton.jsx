import { useState } from "react";
import { createPortal } from "react-dom";
import { Share2, Link2, X } from "lucide-react";
import toast from "react-hot-toast";
import { roomPath } from "../../utils/roomUrl";
import "../../styles/share-button.css";

const SITE_URL = "https://www.roomslider.in";

function ShareButton({ room, variant = "card" }) {
  const [open, setOpen] = useState(false);

  const url = `${SITE_URL}${roomPath(room)}`;
  const text = `${room.title}${room.location ? " - " + room.location : ""} | RoomSlider`;
  const enc = encodeURIComponent;

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({ title: room.title, text, url });
      } catch (err) {
        if (err?.name !== "AbortError") setOpen(true);
      }
      return;
    }
    setOpen(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copy ho gaya");
      setOpen(false);
    } catch {
      toast.error("Link copy nahi hua");
    }
  };

  const options = [
    { name: "WhatsApp", href: `https://wa.me/?text=${enc(text + " " + url)}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
  ];

  return (
    <>
      <button
        type="button"
        className={`share-btn share-btn--${variant}`}
        onClick={handleShare}
        aria-label="Share"
        title="Share"
      >
        <Share2 size={variant === "tile" ? 14 : 17} />
      </button>

      {open &&
        createPortal(
          <div
            className="share-overlay"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          >
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
              <div className="share-head">
                <h4>Share</h4>
                <button
                  type="button"
                  className="share-close"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="share-options">
                {options.map((o) => (
                  <a
                    key={o.name}
                    href={o.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-option"
                    onClick={() => setOpen(false)}
                  >
                    {o.name}
                  </a>
                ))}
                <button type="button" className="share-option" onClick={copyLink}>
                  <Link2 size={16} /> Copy link
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default ShareButton;
