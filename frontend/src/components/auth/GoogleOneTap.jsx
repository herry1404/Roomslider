import { useGoogleOneTapLogin } from "@react-oauth/google";
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

// Pages jahan popup nahi dikhana (login/register mein button pehle se hai)
const HIDDEN_ON = ["/login", "/register", "/admin", "/owner", "/mess"];

function GoogleOneTap() {
  const { user, googleLogin } = useAuth();
  const { pathname } = useLocation();

  const hidden = HIDDEN_ON.some((p) => pathname.startsWith(p));

  useGoogleOneTapLogin({
    disabled: !!user || hidden,
    cancel_on_tap_outside: false,
    onSuccess: async (credentialResponse) => {
      try {
        const result = await googleLogin(credentialResponse.credential);
        if (result?.success) {
          toast.success("Logged in with Google");
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
