import { Helmet } from "react-helmet-async";
import Hero from "../../components/home/Hero";
import Categories from "../../components/home/Categories";
import HourlyBanner from "../../components/home/HourlyBanner";
import LatestRooms from "../../components/home/LatestRooms";

function Home() {
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

      <LatestRooms />
    </>
  );
}

export default Home;
