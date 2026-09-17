import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

import Hero from "../../components/home/Hero";
import Categories from "../../components/home/Categories";
import HourlyBanner from "../../components/home/HourlyBanner";
import CategorySection from "../../components/home/CategorySection";
import api from "../../api/axios";

function Home() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get("/rooms");
        setRooms(res.data?.rooms || []);
      } catch (error) {
        console.error("Home Rooms Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const byCategory = (category) =>
    rooms.filter((r) => r.category === category).slice(0, 10);

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

      <Hero />
      <Categories />

      <section className="container" style={{ padding: "16px 0" }}>
        <HourlyBanner />
      </section>

      {!loading && (
        <>
          <CategorySection
            title="Latest"
            viewAllPath="/rooms"
            rooms={rooms.slice(0, 10)}
          />

          <CategorySection
            title="Latest PGs"
            viewAllPath="/pg"
            rooms={byCategory("PG")}
          />

          <CategorySection
            title="Latest Flats"
            viewAllPath="/flats"
            rooms={byCategory("Flat")}
          />

          <CategorySection
            title="Latest Hostels"
            viewAllPath="/hostels"
            rooms={byCategory("Hostel")}
          />
        </>
      )}
    </>
  );
}

export default Home;
