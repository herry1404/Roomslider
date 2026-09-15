import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function MessRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/mess/login" replace />;
  }

  if (user.role !== "mess") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default MessRoute;
