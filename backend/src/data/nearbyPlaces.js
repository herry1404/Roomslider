// Same reference data as frontend's indoreColleges.js + indoreAreas.js,
// used here to find the nearest college/area to a room by coordinates.

const colleges = [
  { name: "Indian Institute of Technology Indore", latitude: 22.5246385, longitude: 75.9231371 },
  { name: "Indian Institute of Management, Indore (IIM Indore)", latitude: 22.6257658, longitude: 75.7927184 },
  { name: "Devi Ahilya Vishwavidyalaya (DAVV), Nalanda Campus", latitude: 22.7161888, longitude: 75.8718839 },
  { name: "IPS Academy", latitude: 22.655252, longitude: 75.825119 },
  { name: "Medicaps University", latitude: 22.6210224, longitude: 75.8035907 },
  { name: "PIMR (Prestige Institute of Management and Research)", latitude: 22.754247, longitude: 75.902471 },
  { name: "Shri Vaishnav Vidyapeeth Vishwavidyalaya (SVVV)", latitude: 22.824693, longitude: 75.849627 },
  { name: "Government Holkar Science College", latitude: 22.6953888, longitude: 75.8707734 },
  { name: "Mahatma Gandhi Memorial Medical College (MGM)", latitude: 22.7144205, longitude: 75.882917 },
  { name: "Acropolis Institute of Technology and Research (AITR)", latitude: 22.8203867, longitude: 75.9427249 },
];

const areas = [
  { name: "Vijay Nagar", latitude: 22.7532, longitude: 75.8937 },
  { name: "Palasia", latitude: 22.7245, longitude: 75.8837 },
  { name: "Bhawarkuan", latitude: 22.6963, longitude: 75.8683 },
  { name: "Rajendra Nagar", latitude: 22.6975, longitude: 75.8460 },
  { name: "Sudama Nagar", latitude: 22.6890, longitude: 75.8570 },
  { name: "Bengali Square", latitude: 22.7411, longitude: 75.9077 },
  { name: "MG Road", latitude: 22.7167, longitude: 75.8595 },
  { name: "LIG Colony", latitude: 22.7050, longitude: 75.8460 },
  { name: "Rau", latitude: 22.6520, longitude: 75.8130 },
  { name: "Scheme 78 / Bicholi", latitude: 22.7650, longitude: 75.8950 },
];

// Haversine distance in km between two lat/long points
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// Finds the nearest college or area (whichever is closer) to given coords.
// Returns { name, latitude, longitude, distanceKm } or null.
function findNearestPlace(lat, lng) {
  if (lat == null || lng == null) return null;

  const all = [...colleges, ...areas];
  let nearest = null;
  let minDist = Infinity;

  for (const place of all) {
    const d = distanceKm(lat, lng, place.latitude, place.longitude);
    if (d < minDist) {
      minDist = d;
      nearest = place;
    }
  }

  return nearest ? { ...nearest, distanceKm: minDist } : null;
}

// Finds a place (college/area) whose name loosely matches a location string
// (used as fallback when a room has no coordinates)
function findPlaceByLocationText(locationText) {
  if (!locationText) return null;

  const text = locationText.toLowerCase();
  const all = [...colleges, ...areas];

  return all.find((place) => {
    const placeWords = place.name.toLowerCase().split(/\s+/);
    return placeWords.some((word) => word.length > 3 && text.includes(word));
  }) || null;
}

module.exports = { colleges, areas, distanceKm, findNearestPlace, findPlaceByLocationText };
