import { useState } from "react";
import { AMENITY_OPTIONS, normalizeAmenities } from "../../utils/amenities";

function AmenitiesInput({ value, onChange }) {
  const [customAmenity, setCustomAmenity] = useState("");
  const amenities = normalizeAmenities(value);

  const toggle = (amenity) => {
    onChange(amenities.includes(amenity)
      ? amenities.filter((item) => item !== amenity)
      : [...amenities, amenity]);
  };

  const addCustom = () => {
    const amenity = customAmenity.trim();
    if (amenity && !amenities.some((item) => item.toLowerCase() === amenity.toLowerCase())) {
      onChange([...amenities, amenity]);
    }
    setCustomAmenity("");
  };

  return (
    <div className="amenities-picker">
      <div className="amenities-grid">
        {AMENITY_OPTIONS.map((amenity) => (
          <label className="amenity-chip" key={amenity}>
            <input
              type="checkbox"
              checked={amenities.includes(amenity)}
              onChange={() => toggle(amenity)}
            />
            <span>{amenity}</span>
          </label>
        ))}
        {amenities.filter((amenity) => !AMENITY_OPTIONS.includes(amenity)).map((amenity) => (
          <label className="amenity-chip" key={amenity}>
            <input type="checkbox" checked onChange={() => toggle(amenity)} />
            <span>{amenity}</span>
          </label>
        ))}
      </div>
      <div className="amenity-custom-form">
        <input
          value={customAmenity}
          onChange={(event) => setCustomAmenity(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add another amenity"
          maxLength={60}
        />
        <button type="button" onClick={addCustom} disabled={!customAmenity.trim()}>Add Other</button>
      </div>
    </div>
  );
}

export default AmenitiesInput;
