import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Home, Clock, Heart } from "lucide-react";
import ProfileMenu from "./ProfileMenu";

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const goProtected = (path) => {
    if (!user) {
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bottom-nav" aria-label="Bottom Navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          isActive ? "bottom-nav-item active" : "bottom-nav-item"
        }
      >
        <Home size={20} />
        <span>Home</span>
      </NavLink>

      <button
        type="button"
        className={
          isActive("/hourly-rooms") ? "bottom-nav-item active" : "bottom-nav-item"
        }
        onClick={() => goProtected("/hourly-rooms")}
      >
        <Clock size={20} />
        <span>Hourly</span>
      </button>

      <button
        type="button"
        className={
          isActive("/wishlist") ? "bottom-nav-item active" : "bottom-nav-item"
        }
        onClick={() => goProtected("/wishlist")}
      >
        <Heart size={20} />
        <span>Saved</span>
      </button>

      <ProfileMenu variant="bottom" />
    </nav>
  );
}

export default BottomNav;
