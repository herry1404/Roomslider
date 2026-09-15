import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Search, X, Bell } from "lucide-react";
import toast from "react-hot-toast";

import Container from "../ui/Container";
import Logo from "../ui/Logo";
import ProfileMenu from "./ProfileMenu";

import { useAuth } from "../../context/AuthContext";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Rooms", path: "/rooms" },
  { name: "PG", path: "/pg" },
  { name: "Hostels", path: "/hostels" },
  { name: "Flats", path: "/flats" },
  { name: "About", path: "/about" },
  { name: "Explore", path: "/explore" },
];

function SearchPill({ searchOpen, setSearchOpen, searchValue, setSearchValue, handleSearchSubmit, closeSearch }) {
  return (
    <form
      className={`navbar-search-pill ${searchOpen ? "open" : ""}`}
      onSubmit={handleSearchSubmit}
    >
      <button
        type={searchOpen ? "submit" : "button"}
        className="navbar-search-icon-btn"
        aria-label="Search"
        onClick={() => {
          if (!searchOpen) setSearchOpen(true);
        }}
      >
        <Search size={20} />
      </button>

      <input
        type="text"
        placeholder="Search rooms, PG, area..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />

      {searchOpen && (
        <button
          type="button"
          className="navbar-search-close-btn"
          aria-label="Close search"
          onClick={closeSearch}
        >
          <X size={18} />
        </button>
      )}
    </form>
  );
}

function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  const links = user
    ? [
        ...navLinks,
        {
          name: "Wishlist",
          path: "/wishlist",
        },
      ]
    : navLinks;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/rooms?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchOpen(false);
      setSearchValue("");
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchValue("");
  };

  const handleNotificationClick = () => {
    toast("Coming soon", { icon: "🔔" });
  };

  return (
    <header className="navbar">
      <Container>
        <div className="navbar-content">
          {!searchOpen && <Logo />}

          <nav className="navbar-nav" aria-label="Primary Navigation">
            <ul className="navbar-menu">
              {links.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="navbar-actions">
            <button
              type="button"
              className="navbar-notification-btn"
              aria-label="Notifications"
              onClick={handleNotificationClick}
            >
              <Bell size={20} />
            </button>
            <SearchPill
              searchOpen={searchOpen}
              setSearchOpen={setSearchOpen}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              handleSearchSubmit={handleSearchSubmit}
              closeSearch={closeSearch}
            />
            <ProfileMenu />
          </div>

          <div className="navbar-mobile-actions">
            <button
              type="button"
              className="navbar-notification-btn"
              aria-label="Notifications"
              onClick={handleNotificationClick}
            >
              <Bell size={20} />
            </button>
            <SearchPill
              searchOpen={searchOpen}
              setSearchOpen={setSearchOpen}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              handleSearchSubmit={handleSearchSubmit}
              closeSearch={closeSearch}
            />
          </div>
        </div>
      </Container>
    </header>
  );
}

export default Navbar;
