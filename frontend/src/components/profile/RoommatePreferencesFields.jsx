const choices = {
  seeking: [
    ["both", "Open to finding a room or roommate"],
    ["room", "Looking for a room"],
    ["roommate", "I have a room and need a roommate"],
  ],
  sharingType: [
    ["", "No preference"],
    ["Single", "Single"],
    ["Double", "Double"],
    ["Triple", "Triple"],
    ["Other", "Other"],
  ],
  cleanliness: [
    ["", "No preference"],
    ["relaxed", "Relaxed"],
    ["moderate", "Moderate"],
    ["very", "Very tidy"],
  ],
  sleepSchedule: [
    ["", "No preference"],
    ["early", "Early"],
    ["flexible", "Flexible"],
    ["late", "Late"],
  ],
  smoking: [
    ["", "No preference"],
    ["no", "No"],
    ["sometimes", "Sometimes"],
    ["yes", "Yes"],
  ],
  guests: [
    ["", "No preference"],
    ["rarely", "Rarely"],
    ["sometimes", "Sometimes"],
    ["often", "Often"],
  ],
};

function SelectField({ label, value, options, onChange, disabled = false }) {
  return (
    <>
      <label className="profile-label">{label}</label>
      <select className="profile-input" value={value || ""} onChange={onChange} disabled={disabled}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue || "none"} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </>
  );
}

function RoommatePreferencesFields({
  value,
  onChange,
  onLifestyleChange,
  disabled = false,
}) {
  return (
    <>
      <h2 className="profile-section">Roommate preferences</h2>
      <label className="profile-label">Show my profile in roommate matches</label>
      <select
        className="profile-input"
        value={value.active ? "active" : "paused"}
        onChange={(event) => onChange("active", event.target.value === "active")}
        disabled={disabled}
      >
        <option value="active">Active</option>
        <option value="paused">Paused</option>
      </select>

      <SelectField
        label="I am"
        value={value.seeking}
        options={choices.seeking}
        onChange={(event) => onChange("seeking", event.target.value)}
        disabled={disabled}
      />
      <label className="profile-label">Monthly budget (minimum)</label>
      <input
        className="profile-input"
        type="number"
        min="0"
        value={value.budgetMin ?? ""}
        onChange={(event) => onChange("budgetMin", event.target.value)}
        disabled={disabled}
      />
      <label className="profile-label">Monthly budget (maximum)</label>
      <input
        className="profile-input"
        type="number"
        min="0"
        value={value.budgetMax ?? ""}
        onChange={(event) => onChange("budgetMax", event.target.value)}
        disabled={disabled}
      />
      <label className="profile-label">Move-in date</label>
      <input
        className="profile-input"
        type="date"
        value={value.moveInDate ? String(value.moveInDate).slice(0, 10) : ""}
        onChange={(event) => onChange("moveInDate", event.target.value)}
        disabled={disabled}
      />
      <SelectField
        label="Preferred sharing"
        value={value.sharingType}
        options={choices.sharingType}
        onChange={(event) => onChange("sharingType", event.target.value)}
        disabled={disabled}
      />
      {Object.entries(choices)
        .filter(([key]) => ["cleanliness", "sleepSchedule", "smoking", "guests"].includes(key))
        .map(([key, options]) => (
          <SelectField
            key={key}
            label={{
              cleanliness: "Cleanliness",
              sleepSchedule: "Sleep schedule",
              smoking: "Smoking",
              guests: "Guests",
            }[key]}
            value={value.lifestyle?.[key]}
            options={options}
            onChange={(event) => onLifestyleChange(key, event.target.value)}
            disabled={disabled}
          />
        ))}
    </>
  );
}

export default RoommatePreferencesFields;
