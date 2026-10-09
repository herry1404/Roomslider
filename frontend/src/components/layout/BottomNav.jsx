import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Home, MapPin, Search } from "lucide-react";
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
        to="/rooms"
        className={() => isActive("/rooms") ? "bottom-nav-item active" : "bottom-nav-item"}
      >
        <Search size={19} />
        <span>Search</span>
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
