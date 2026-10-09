import { Plus, X } from "lucide-react";

function HourlySlabsInput({
  enabled,
  onEnabledChange,
  hourlyOnly,
  onHourlyOnlyChange,
  slabs,
  onSlabsChange,
  extraHourPrice,
  onExtraHourPriceChange,
  checkIn24x7,
  onCheckIn24x7Change,
}) {
  const addSlab = (hours = "") => {
    onSlabsChange([...slabs, { hours, price: "" }]);
  };

  const updateSlab = (index, field, value) => {
    onSlabsChange(slabs.map((slab, slabIndex) =>
      slabIndex === index ? { ...slab, [field]: value } : slab
    ));
  };

  const setPresets = () => {
    const existing = new Set(slabs.map((slab) => Number(slab.hours)).filter(Number.isFinite));
    onSlabsChange([
      ...slabs,
      ...[3, 6, 12].filter((hours) => !existing.has(hours)).map((hours) => ({ hours, price: "" })),
    ]);
  };

  const duplicateHours = slabs.some((slab, index) => (
    slab.hours !== "" && slabs.findIndex((other) => Number(other.hours) === Number(slab.hours)) !== index
  ));

  return (
    <section className="form-section hourly-slabs-input">
      <label className="checkbox">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
        />
        Hourly Stay available
      </label>
      {enabled && (
        <>
          <fieldset className="hourly-booking-mode">
            <legend>Booking options</legend>
            <label>
              <input
                type="radio"
                name="hourly-booking-mode"
                checked={hourlyOnly}
                onChange={() => onHourlyOnlyChange(true)}
              />
              Sirf hourly
            </label>
            <label>
              <input
                type="radio"
                name="hourly-booking-mode"
                checked={!hourlyOnly}
                onChange={() => onHourlyOnlyChange(false)}
              />
              Hourly + normal booking dono
            </label>
          </fieldset>
          <div className="hourly-slabs-toolbar">
            <h3>Hourly stay prices</h3>
            <div>
              <button type="button" onClick={setPresets}>3 / 6 / 12 hrs</button>
              <button type="button" onClick={() => addSlab()}><Plus size={15} /> Add slab</button>
            </div>
          </div>
          {slabs.map((slab, index) => (
            <div className="hourly-slab-row" key={`${index}-${slab.hours}`}>
              <label>
                <span>Hours</span>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={slab.hours}
                  onChange={(event) => updateSlab(index, "hours", event.target.value)}
                  required
                />
              </label>
              <label>
                <span>Price (₹)</span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={slab.price}
                  onChange={(event) => updateSlab(index, "price", event.target.value)}
                  required
                />
              </label>
              <button
                type="button"
                className="hourly-slab-remove"
                aria-label={`Remove ${slab.hours || "hourly"} hour slab`}
                onClick={() => onSlabsChange(slabs.filter((_, slabIndex) => slabIndex !== index))}
              >
                <X size={17} />
              </button>
            </div>
          ))}
          {duplicateHours && <p className="hourly-slab-error">Each slab must have a different number of hours.</p>}
          <label className="hourly-extra-price">
            <span>Extra hour price (₹, optional)</span>
            <input
              type="number"
              min="0.01"
              step="any"
              value={extraHourPrice}
              onChange={(event) => onExtraHourPriceChange(event.target.value)}
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={checkIn24x7}
              onChange={(event) => onCheckIn24x7Change(event.target.checked)}
            />
            24x7 check-in
          </label>
        </>
      )}
    </section>
  );
}

export default HourlySlabsInput;
