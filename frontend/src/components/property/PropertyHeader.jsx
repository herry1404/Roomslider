import { Heart, Share2 } from "lucide-react";
import shareProperty from "../../utils/shareProperty";

function PropertyHeader({ room, wishlisted, onSave, onShare = () => shareProperty(room), showSave = true }) {
  const facts = [
    room.category,
    room.location,
    room.sharingType && `${room.sharingType} sharing`,
    room.rooms != null && `${room.rooms} room${room.rooms === 1 ? "" : "s"}`,
    room.bathrooms != null && `${room.bathrooms} bath${room.bathrooms === 1 ? "" : "s"}`,
  ].filter(Boolean);

  return (
    <header className="pd-header">
      <div className="pd-header-copy">
        <h1>{room.title}</h1>
        {facts.length > 0 && <p>{facts.join(" · ")}</p>}
      </div>
      <div className="pd-header-actions">
        <button type="button" onClick={onShare}><Share2 size={17} /> Share</button>
        {showSave && (
          <button type="button" onClick={onSave}>
            <Heart size={17} fill={wishlisted ? "currentColor" : "none"} />
            {wishlisted ? "Saved" : "Save"}
          </button>
        )}
      </div>
    </header>
  );
}

export default PropertyHeader;
