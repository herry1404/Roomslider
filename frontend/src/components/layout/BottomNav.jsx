import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Home, MapPin, Compass } from "lucide-react";
import ProfileMenu from "./ProfileMenu";
import { useHideOnScroll } from "../../hooks/useHideOnScroll";

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const hidden = useHideOnScroll(80);

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
