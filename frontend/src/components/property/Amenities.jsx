import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bath,
  BedDouble,
  BookOpen,
  CarFront,
  Camera,
  Check,
  Droplets,
  Fan,
  Heater,
  Refrigerator,
  ShieldCheck,
  Shirt,
  Snowflake,
  Utensils,
  Wifi,
  X,
  Tv,
} from "lucide-react";

const iconForAmenity = (amenity) => {
  const value = amenity.toLowerCase();
  if (value.includes("wifi") || value.includes("wi-fi") || value.includes("internet")) return Wifi;
  if (value.includes("bath") || value.includes("shower") || value.includes("washroom")) return Bath;
  if (value.includes("bed")) return BedDouble;
  if (value.includes("food") || value.includes("kitchen") || value.includes("mess")) return Utensils;
  if (value === "ac" || value.includes("air condition")) return Snowflake;
  if (value.includes("fan")) return Fan;
  if (value.includes("laundry") || value.includes("washing")) return Shirt;
  if (value.includes("geyser") || value.includes("hot water")) return Heater;
  if (value.includes("fridge")) return Refrigerator;
  if (value.includes("parking")) return CarFront;
  if (value.includes("cctv")) return Camera;
  if (value.includes("power") || value.includes("backup")) return ShieldCheck;
  if (value.includes("study")) return BookOpen;
  if (value.includes("water")) return Droplets;
  if (value.includes("tv")) return Tv;
  return Check;
};

function Amenities({ amenities = [] }) {
  const [open, setOpen] = useState(false);
  const amenityList = [...new Set((Array.isArray(amenities) ? amenities : String(amenities).split(","))
    .map((amenity) => String(amenity).trim()).filter(Boolean))];

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

  if (!amenityList.length) return null;
  const shown = amenityList.slice(0, 8);

  return (
    <section className="pd-section">
      <h2>What this place offers</h2>
      <ul className="pd-amenities-grid">
        {shown.map((amenity) => {
          const Icon = iconForAmenity(amenity);
          return <li key={amenity}><Icon size={19} aria-hidden="true" /><span>{amenity}</span></li>;
        })}
      </ul>
      {amenityList.length > 8 && (
        <button type="button" className="pd-outline-button" onClick={() => setOpen(true)}>
          Show all {amenityList.length} amenities
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
              {amenityList.map((amenity) => {
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
