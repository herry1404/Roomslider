import { useEffect, useState } from "react";
import api from "../api/axios";
import { readRecentlyViewedIds } from "../utils/recentlyViewed";

export default function useRecentlyViewedListings() {
  const [result, setResult] = useState({ rooms: [], loading: true, hasHistory: false });

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      const ids = readRecentlyViewedIds();
      if (!ids.length) {
        if (active) setResult({ rooms: [], loading: false, hasHistory: false });
        return;
      }
      try {
        const { data } = await api.get("/rooms", { params: { ids: ids.join(",") } });
        if (active) setResult({ rooms: data.rooms || [], loading: false, hasHistory: true });
      } catch (error) {
        console.error("Recently viewed listings could not be loaded:", error);
        if (active) setResult({ rooms: [], loading: false, hasHistory: true });
      }
    });
    return () => { active = false; };
  }, []);

  return result;
}
