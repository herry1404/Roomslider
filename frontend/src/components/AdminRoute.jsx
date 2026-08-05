import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
  const { user } = useAuth();

  // Login nahi hai
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Admin nahi hai
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Admin hai
  return children;
}

export default AdminRoute;