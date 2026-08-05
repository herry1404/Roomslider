import Hero from "../../components/home/Hero";
import Categories from "../../components/home/Categories";
import LatestRooms from "../../components/home/LatestRooms";
import MapExplorer from "../../components/map/MapExplorer";

function Home() {
  return (
    <>
      <Hero />
      <Categories />

      <section className="container" style={{ padding: "40px 0" }}>
        <h2 style={{ marginBottom: "16px" }}>Explore on Map</h2>
        <MapExplorer />
      </section>

      <LatestRooms />
    </>
  );
}

export default Home;
