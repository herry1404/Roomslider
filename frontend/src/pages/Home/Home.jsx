import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

import Hero from "../../components/home/Hero";
import Categories from "../../components/home/Categories";
import ExploreTeaser from "../../components/home/ExploreTeaser";
import CategorySection from "../../components/home/CategorySection";
import HomeBanner from "../../components/home/HomeBanner";
import api from "../../api/axios";

const CACHE_KEY = "homeSectionsV1";

// Backend na chale ya list abhi na aaye to yahi layout dikhta hai
const DEFAULT_SECTIONS = [
  { _id: "d-hero", type: "hero" },
  { _id: "d-categories", type: "categories" },
  { _id: "d-rooms", type: "listings", title: "Rooms", config: { category: "Room", limit: 10, viewAllPath: "/rooms" } },
  { _id: "d-flats", type: "listings", title: "Flats", config: { category: "Flat", limit: 10, viewAllPath: "/flats" } },
  { _id: "d-pg", type: "listings", title: "PG", config: { category: "PG", limit: 10, viewAllPath: "/pg" } },
  { _id: "d-hostels", type: "listings", title: "Hostels", config: { category: "Hostel", limit: 10, viewAllPath: "/hostels" } },
  { _id: "d-explore", type: "explore" },
];

const CATEGORY_PATH = { Room: "/rooms", PG: "/pg", Hostel: "/hostels", Flat: "/flats" };

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
};

const matches = (room, cfg = {}) => {
  if (cfg.category && room.category !== cfg.category) return false;

  if (cfg.area) {
    const loc = (room.location || "").toLowerCase();
    if (!loc.includes(cfg.area.toLowerCase())) return false;
  }

  if (cfg.college) {
    const hay = [...(room.nearby || []), room.location || "", room.title || ""]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(cfg.college.toLowerCase())) return false;
  }

  return true;
};

function Home() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState(() => readCache() || DEFAULT_SECTIONS);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get("/rooms", { params: { grouped: "true" } });
        setRooms(res.data?.rooms || []);
      } catch (error) {
        console.error("Home Rooms Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    let active = true;

    api
      .get("/home-sections")
      .then((res) => {
        const list = res.data?.sections;
        if (!active || !Array.isArray(list) || list.length === 0) return;
        setSections(list);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(list));
        } catch {
          // storage full ya band, koi baat nahi
        }
      })
      .catch(() => {
        // default ya cached layout hi dikhta rahega
      });

    return () => {
      active = false;
    };
  }, []);

  const renderSection = (s) => {
    switch (s.type) {
      case "hero":
        return <Hero key={s._id} />;
      case "categories":
        return null;
      case "explore":
        return <ExploreTeaser key={s._id} />;
      case "banner":
        return <HomeBanner key={s._id} section={s} />;
      case "listings": {
        if (loading) return null;
        const cfg = s.config || {};
        const list = rooms.filter((r) => matches(r, cfg)).slice(0, cfg.limit || 10);
        return (
          <CategorySection
            key={s._id}
            title={s.title || "Listings"}
            viewAllPath={cfg.viewAllPath || CATEGORY_PATH[cfg.category] || "/rooms"}
            rooms={list}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>RoomSlider - Verified Rooms, PG, Hostels & Flats in Indore</title>
        <meta
          name="description"
          content="Find verified rooms, PG, hostels and flats for rent in Indore. Trusted listings, simple search and a hassle-free renting experience with RoomSlider."
        />
        <link rel="canonical" href="https://www.roomslider.in/" />
      </Helmet>

      <div className="home-page">
        {sections.map(renderSection)}
      </div>
    </>
  );
}

export default Home;
