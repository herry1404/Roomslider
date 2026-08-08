import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  UserCircle,
  LogIn,
  UserPlus,
  Heart,
  Clock,
  LogOut,
  Settings as SettingsIcon,
  Building2,
  LayoutDashboard,
  Home,
} from "lucide-react";

import api from "../../api/axios";

function ProfileMenu() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [isTenant, setIsTenant] = useState(false);

  useEffect(() => {
    if (user && user.role === "user") {
      api
        .get("/auth/my-tenancy")
        .then((res) => {
          setIsTenant(!!res.data.isTenant);
        })
        .catch(() => {
          setIsTenant(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    closeMenu();
    navigate("/", { replace: true });
    window.location.reload();
  };

  return (
    <div className="profile-menu" ref={menuRef}>
      <button
        className="profile-btn"
        aria-label="Account Menu"
        onClick={() => setIsOpen(!isOpen)}
      >
        <UserCircle size={26} />
      </button>

      <div className={isOpen ? "profile-dropdown open" : "profile-dropdown"}>
        {user ? (
          <>
            <div className="profile-user">
              <h4>{user.name}</h4>
              <p>{user.email}</p>
            </div>

            <div className="profile-divider" />

            {user.role === "admin" && (
              <NavLink to="/admin/dashboard" className="profile-item" onClick={closeMenu}>
                <LayoutDashboard size={16} />
                Dashboard
              </NavLink>
            )}

            {user.role === "owner" && (
              <NavLink to="/owner/dashboard" className="profile-item" onClick={closeMenu}>
                <LayoutDashboard size={16} />
                Dashboard
              </NavLink>
            )}

            {isTenant && (
              <NavLink to="/my-place" className="profile-item" onClick={closeMenu}>
                <Home size={16} />
                Your Place
              </NavLink>
            )}

            <NavLink to="/wishlist" className="profile-item" onClick={closeMenu}>
              <Heart size={16} />
              Wishlist
            </NavLink>

            <NavLink to="/recently-viewed" className="profile-item" onClick={closeMenu}>
              <Clock size={16} />
              Recently Viewed
            </NavLink>

            <NavLink to="/settings" className="profile-item" onClick={closeMenu}>
              <SettingsIcon size={16} />
              Settings
            </NavLink>

            <div className="profile-divider" />

            {user.role !== "owner" && (
              <NavLink to="/owner/login" className="profile-item" onClick={closeMenu}>
                <Building2 size={16} />
                Owner Login
              </NavLink>
            )}

            <div className="profile-divider" />

            <button className="profile-item profile-item-danger" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="profile-item" onClick={closeMenu}>
              <LogIn size={16} />
              Login
            </NavLink>

            <NavLink to="/register" className="profile-item" onClick={closeMenu}>
              <UserPlus size={16} />
              Signup
            </NavLink>

            <div className="profile-divider" />

            <NavLink to="/settings" className="profile-item" onClick={closeMenu}>
              <SettingsIcon size={16} />
              Settings
            </NavLink>

            <div className="profile-divider" />

            <NavLink to="/owner/login" className="profile-item" onClick={closeMenu}>
              <Building2 size={16} />
              Owner Login
            </NavLink>
          </>
        )}
      </div>
    </div>
  );
}

export default ProfileMenu;
