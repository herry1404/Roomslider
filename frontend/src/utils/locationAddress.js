export const lookupPostalCode = async (postalCode) => {
  if (!/^\d{6}$/.test(postalCode)) {
    throw new Error("Enter a valid 6-digit PIN code.");
  }

  const response = await fetch(`https://api.postalpincode.in/pincode/${postalCode}`);
  if (!response.ok) throw new Error("PIN code lookup failed.");

  const [result] = await response.json();
  const offices = result?.Status === "Success" && Array.isArray(result.PostOffice)
    ? result.PostOffice
    : [];
  if (!offices.length) throw new Error("PIN code not found.");

  return {
    areas: [...new Set(offices.map((office) => office.Name?.trim()).filter(Boolean))],
    city: offices[0].District || offices[0].Block || "",
    state: offices[0].State || "",
  };
};

export const geocodeLocation = async (place) => {
  const queryText = String(place || "").trim();
  if (!queryText) throw new Error("Enter an area or city to find its location.");

  const query = new URLSearchParams({
    format: "jsonv2",
    limit: "1",
    q: `${queryText}, India`,
  });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${query.toString()}`,
    { headers: { "Accept-Language": "en" } }
  );
  if (!response.ok) throw new Error("Location lookup failed.");

  const [result] = await response.json();
  const latitude = Number(result?.lat);
  const longitude = Number(result?.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Could not find that area.");
  }

  return {
    latitude,
    longitude,
    formattedAddress: result.display_name || queryText,
  };
};

export const reverseGeocodeLocation = async (latitude, longitude) => {
  if (
    !Number.isFinite(Number(latitude)) ||
    !Number.isFinite(Number(longitude)) ||
    Math.abs(Number(latitude)) > 90 ||
    Math.abs(Number(longitude)) > 180
  ) {
    throw new Error("Invalid location coordinates.");
  }

  const query = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    lat: String(latitude),
    lon: String(longitude),
  });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${query.toString()}`,
    { headers: { "Accept-Language": "en" } }
  );
  if (!response.ok) throw new Error("Address lookup failed.");

  const result = await response.json();
  const address = result.address || {};
  return {
    latitude: Number(latitude),
    longitude: Number(longitude),
    houseNumber: address.house_number || "",
    area:
      address.neighbourhood ||
      address.suburb ||
      address.quarter ||
      address.residential ||
      address.city_district ||
      address.county ||
      "",
    nearby: address.road || "",
    city:
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      "",
    state: address.state || "",
    postalCode: /^\d{6}$/.test(address.postcode?.replace(/\D/g, "") || "")
      ? address.postcode.replace(/\D/g, "")
      : "",
    formattedAddress: result.display_name || "",
  };
};

export const formatLocationAddress = (address) =>
  [
    address.houseNumber,
    address.area,
    address.nearby ? `Near ${address.nearby}` : "",
    address.city,
    address.state,
    address.postalCode,
  ].filter(Boolean).join(", ");
