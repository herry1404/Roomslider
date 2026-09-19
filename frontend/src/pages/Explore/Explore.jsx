import { Helmet } from "react-helmet-async";
import ComingSoonServices from "../../components/explore/ComingSoonServices";

function Explore() {
  return (
    <div className="container" style={{ padding: "24px 0 40px" }}>
      <Helmet>
        <title>Explore Services - RoomSlider</title>
      </Helmet>

      <h2 style={{ marginBottom: "16px" }}>Explore Services</h2>

      <ComingSoonServices />
    </div>
  );
}

export default Explore;
