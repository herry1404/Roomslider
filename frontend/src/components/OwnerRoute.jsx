import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function OwnerRoute({ children }) {
  const { user } = useAuth();

  // Login nahi hai
  if (!user) {
    return <Navigate to="/owner/login" replace />;
  }

  // Owner nahi hai
  if (user.role !== "owner") {
    return <Navigate to="/" replace />;
  }

  // Owner hai
  return children;
}

export default OwnerRoute;
