import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Home, MapPin, Compass } from "lucide-react";
import ProfileMenu from "./ProfileMenu";

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 80) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goProtected = (path) => {
    if (!user) {
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`bottom-nav ${hidden ? "bottom-nav-hidden" : ""}`} aria-label="Bottom Navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          isActive ? "bottom-nav-item active" : "bottom-nav-item"
        }
      >
        <Home size={18} />
        <span>Home</span>
      </NavLink>

      <button
        type="button"
        className={
          isActive("/map") ? "bottom-nav-item active" : "bottom-nav-item"
        }
        onClick={() => navigate("/map")}
      >
        <MapPin size={18} />
        <span>Map</span>
      </button>

      <button
        type="button"
        className={
          isActive("/explore") ? "bottom-nav-item active" : "bottom-nav-item"
        }
        onClick={() => navigate("/explore")}
      >
        <Compass size={18} />
        <span>Explore</span>
      </button>

      <ProfileMenu variant="bottom" />
    </nav>
  );
}

export default BottomNav;
