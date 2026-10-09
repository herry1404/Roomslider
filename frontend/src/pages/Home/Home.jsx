import { Fragment, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

import Hero from "../../components/home/Hero";
import Categories from "../../components/home/Categories";
import ExploreTeaser from "../../components/home/ExploreTeaser";
import CategorySection from "../../components/home/CategorySection";
import HomeBanner from "../../components/home/HomeBanner";
import HomeRentalSection from "../../components/home/HomeRentalSection";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";
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
  { _id: "d-hourly-rooms", type: "hourlyRooms", title: "Hourly / Short Stay" },
  { _id: "d-villas", type: "villas", title: "Villas for Stays & Events" },
  { _id: "d-explore", type: "explore" },
];

const CATEGORY_PATH = { Room: "/rooms", PG: "/pg", Hostel: "/hostels", Flat: "/flats" };

function ListingSectionSkeleton({ title, viewAllPath }) {
  return (
    <section className="latest-rooms home-listings-loading" aria-label={`Loading ${title}`}>
      <div className="container">
        <div className="section-header">
          <h2>{title}</h2>
          <span className="home-skeleton-view-all" aria-hidden="true" />
        </div>
        <div className="rooms-grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonRoomCard key={`${viewAllPath}-${index}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

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
    const controller = new AbortController();
    const fetchRooms = async () => {
      try {
        const res = await api.get("/rooms", {
          params: { grouped: "true", hourly: "false" },
          signal: controller.signal,
        });
        setRooms(res.data?.rooms || []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Home Rooms Error:", error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchRooms();
    return () => controller.abort();
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
        return <Categories key={s._id} />;
      case "explore":
        return <ExploreTeaser key={s._id} section={s} />;
      case "hourlyRooms":
      case "villas":
        return <HomeRentalSection key={s._id} type={s.type} title={s.title || (s.type === "villas" ? "Villas" : "Hourly / Short Stay")} />;
      case "banner":
        return <HomeBanner key={s._id} section={s} />;
      case "listings": {
        const cfg = s.config || {};
        const title = s.title || "Listings";
        const viewAllPath = cfg.viewAllPath || CATEGORY_PATH[cfg.category] || "/rooms";
        if (loading) {
          return <ListingSectionSkeleton key={s._id} title={title} viewAllPath={viewAllPath} />;
        }
        const list = rooms.filter((r) => matches(r, cfg)).slice(0, cfg.limit || 10);
        return (
          <CategorySection
            key={s._id}
            title={title}
            viewAllPath={viewAllPath}
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
        <link rel="canonical" href="https://roomslider.in/" />
      </Helmet>

      <div className="home-page">
        {sections.map((section) => (
          <Fragment key={section._id}>
            {renderSection(section)}
          </Fragment>
        ))}
      </div>
    </>
  );
}

export default Home;
