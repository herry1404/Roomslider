import { useState, useEffect } from 'react';
import { getCurrentPosition } from '../utils/deviceLocation';

const INDORE_CENTER = { lat: 22.7196, lng: 75.8577 };
const DEFAULT_ZOOM = 13;

export function useDefaultMapCenter() {
  const [center, setCenter] = useState(INDORE_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    let active = true;
    getCurrentPosition({ timeout: 5000 })
      .then((pos) => {
        if (!active) return;
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setZoom(DEFAULT_ZOOM);
        setLocating(false);
      })
      .catch(() => {
        if (!active) return;
        setCenter(INDORE_CENTER);
        setLocating(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { center, zoom, locating };
}
