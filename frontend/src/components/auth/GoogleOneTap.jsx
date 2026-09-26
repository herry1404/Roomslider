import { useGoogleOneTapLogin } from "@react-oauth/google";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

// Pages jahan popup nahi dikhana (login/register mein button pehle se hai)
const HIDDEN_ON = [
  "/login",
  "/register",
  "/complete-profile",
  "/admin",
  "/owner",
  "/mess",
];

function GoogleOneTap() {
  const { user, googleLogin } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const hidden = HIDDEN_ON.some((p) => pathname.startsWith(p));

  useGoogleOneTapLogin({
    disabled: !!user || hidden,
    cancel_on_tap_outside: false,
    onSuccess: async (credentialResponse) => {
      try {
        const result = await googleLogin(credentialResponse.credential);

        if (!result?.success) return;

        toast.success(result.message || "Login successful");

        if (result.needsPhone) {
          navigate("/complete-profile", { replace: true });
        } else if (result.user?.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Google login failed"
        );
      }
    },
    onError: () => {},
  });

  return null;
}

export default GoogleOneTap;
