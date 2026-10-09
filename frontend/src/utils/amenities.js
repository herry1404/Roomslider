export const AMENITY_OPTIONS = [
  "Wi-Fi",
  "AC",
  "Geyser",
  "Attached Washroom",
  "TV",
  "Fridge",
  "Power Backup",
  "CCTV",
  "Parking",
  "Lift",
  "Laundry",
  "Meals",
  "Hot Water",
  "Study Table",
  "Wardrobe",
  "Cleaning",
  "24x7 Check-in",
];

export function normalizeAmenities(value) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))];
}
