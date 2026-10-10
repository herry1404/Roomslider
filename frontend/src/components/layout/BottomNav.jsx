import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Compass, Home, MapPin } from "lucide-react";
import ProfileMenu from "./ProfileMenu";

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <nav className="bottom-nav" aria-label="Bottom Navigation">
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

      <NavLink
        to="/explore"
        data-tour="explore"
        className={() => isActive("/explore") ? "bottom-nav-item active" : "bottom-nav-item"}
      >
        <Compass size={19} />
        <span>Explore</span>
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
      <ProfileMenu variant="bottom" active={isActive("/profile")} />
    </nav>
  );
}

export default BottomNav;
