import { Helmet } from "react-helmet-async";
import Hero from "../../components/home/Hero";
import Categories from "../../components/home/Categories";
import LatestRooms from "../../components/home/LatestRooms";
import MapExplorer from "../../components/map/MapExplorer";

function Home() {
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

      <Hero />
      <Categories />

      <LatestRooms />

      <section className="container" style={{ padding: "40px 0" }}>
        <h2 style={{ marginBottom: "16px" }}>Explore on Map</h2>
        <MapExplorer />
      </section>
    </>
  );
}

export default Home;
