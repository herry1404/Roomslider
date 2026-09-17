import { Helmet } from "react-helmet-async";
import MapExplorer from "../../components/map/MapExplorer";

function MapView() {
  return (
    <>
      <Helmet>
        <title>Explore on Map - RoomSlider</title>
      </Helmet>

      <MapExplorer startExpanded allowCollapse={false} fullscreen />
    </>
  );
}

export default MapView;
