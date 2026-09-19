import { Helmet } from "react-helmet-async";
import MessBanner from "../../components/home/MessBanner";
import LaundryBanner from "../../components/explore/LaundryBanner";
import ComingSoonServices from "../../components/explore/ComingSoonServices";

function Explore() {
  return (
    <div className="container" style={{ padding: "24px 0 40px" }}>
      <Helmet>
        <title>Explore Services - RoomSlider</title>
      </Helmet>

      <h2 style={{ marginBottom: "16px" }}>Explore Services</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <MessBanner />
        <LaundryBanner />
      </div>

      <ComingSoonServices />
    </div>
  );
}

export default Explore;
