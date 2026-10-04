import { Share2 } from "lucide-react";
import shareProperty from "../../utils/shareProperty";
import "../../styles/share-button.css";

function ShareButton({ room, variant = "card" }) {
  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await shareProperty(room);
  };

  return (
    <button
      type="button"
      className={`share-btn share-btn--${variant}`}
      onClick={handleShare}
      aria-label="Share"
      title="Share"
    >
      <Share2 size={variant === "tile" ? 14 : 17} />
    </button>
  );
}

export default ShareButton;
