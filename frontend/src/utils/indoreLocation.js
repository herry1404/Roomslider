import indoreAreas from "../data/indoreAreas";
import indoreColleges from "../data/indoreColleges";

const places = [...indoreAreas, ...indoreColleges];

export function normalizePlaceName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/bhawarkuan/g, "bhawarkua")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findIndorePlace(search) {
  const query = normalizePlaceName(search);
  if (!query) return null;
  return places.find((place) => {
    const name = normalizePlaceName(place.name);
    return query.includes(name) || name.includes(query);
  }) || null;
}

export function distanceKm(latitude, longitude, targetLatitude, targetLongitude) {
  const values = [latitude, longitude, targetLatitude, targetLongitude].map(Number);
  if (!values.every(Number.isFinite)) return Infinity;
  const [lat1, lon1, lat2, lon2] = values;
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const deltaLatitude = radians(lat2 - lat1);
  const deltaLongitude = radians(lon2 - lon1);
  const arc =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(radians(lat1)) *
      Math.cos(radians(lat2)) *
      Math.sin(deltaLongitude / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(arc));
}
