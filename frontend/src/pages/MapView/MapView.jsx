import { Helmet } from "react-helmet-async";
import MapExplorer from "../../components/map/MapExplorer";

function MapView() {
  return (
    <>
      <Helmet>
        <title>Explore on Map - RoomSlider</title>
      </Helmet>

      <section className="container" style={{ padding: "24px 0 60px" }}>
        <h2 style={{ marginBottom: "16px" }}>Explore on Map</h2>
        <MapExplorer />
      </section>
    </>
  );
}

export default MapView;
