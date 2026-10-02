import { Navigate, useParams } from "react-router-dom";

function HourlyRoomCheckout() {
  const { id } = useParams();
  return <Navigate to={`/hourly-rooms/${id}`} replace />;
}

export default HourlyRoomCheckout;
