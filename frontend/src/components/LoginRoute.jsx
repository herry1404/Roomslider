import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function LoginRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      toast.error("Login first", { id: "login-first" });
    }
  }, [user]);

  // Login nahi hai: login page pe bhejo, login ke baad wapas yahin aayega
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default LoginRoute;
