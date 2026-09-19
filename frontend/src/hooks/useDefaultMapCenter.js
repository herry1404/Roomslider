import { useState, useEffect } from 'react';

const INDORE_CENTER = { lat: 22.7196, lng: 75.8577 };
const DEFAULT_ZOOM = 13;

export function useDefaultMapCenter() {
  const [center, setCenter] = useState(INDORE_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setZoom(DEFAULT_ZOOM);
        setLocating(false);
      },
      () => {
        setCenter(INDORE_CENTER);
        setLocating(false);
      },
      { timeout: 5000 }
    );
  }, []);

  return { center, zoom, locating };
}
