import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bath,
  BedDouble,
  Check,
  Fan,
  Shirt,
  Snowflake,
  Utensils,
  Wifi,
  X,
} from "lucide-react";

const iconForAmenity = (amenity) => {
  const value = amenity.toLowerCase();
  if (value.includes("wifi") || value.includes("internet")) return Wifi;
  if (value.includes("bath") || value.includes("shower")) return Bath;
  if (value.includes("bed")) return BedDouble;
  if (value.includes("food") || value.includes("kitchen") || value.includes("mess")) return Utensils;
  if (value.includes("ac") || value.includes("air condition")) return Snowflake;
  if (value.includes("fan")) return Fan;
  if (value.includes("laundry") || value.includes("washing")) return Shirt;
  return Check;
};

function Amenities({ amenities = [] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!amenities.length) return null;
  const shown = amenities.slice(0, 8);

  return (
    <section className="pd-section">
      <h2>What this place offers</h2>
      <ul className="pd-amenities-grid">
        {shown.map((amenity) => {
          const Icon = iconForAmenity(amenity);
          return <li key={amenity}><Icon size={19} aria-hidden="true" /><span>{amenity}</span></li>;
        })}
      </ul>
      {amenities.length > 8 && (
        <button type="button" className="pd-outline-button" onClick={() => setOpen(true)}>
          Show all {amenities.length} amenities
        </button>
      )}
      {open && createPortal(
        <div
          className="pd-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section className="pd-amenities-modal" role="dialog" aria-modal="true" aria-labelledby="pd-amenities-title">
            <header>
              <h2 id="pd-amenities-title">What this place offers</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close amenities">
                <X size={20} />
              </button>
            </header>
            <ul className="pd-amenities-modal-list">
              {amenities.map((amenity) => {
                const Icon = iconForAmenity(amenity);
                return <li key={amenity}><Icon size={20} aria-hidden="true" /><span>{amenity}</span></li>;
              })}
            </ul>
          </section>
        </div>,
        document.body
      )}
    </section>
  );
}

export default Amenities;
