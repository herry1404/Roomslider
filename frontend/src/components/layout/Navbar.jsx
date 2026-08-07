import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Search, X, Sun, Moon } from "lucide-react";

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
];

function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    // Dark mode temporarily disabled - forcing light theme
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

  const SearchPill = () => (
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

  const ThemeToggle = () => (
    <button
      type="button"
      className="navbar-theme-btn"
      aria-label="Toggle dark mode"
      title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      onClick={() => setDarkMode((prev) => !prev)}
    >
      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );

  return (
    <header className="navbar">
      <Container>
        <div className="navbar-content">
          <Logo />

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
            <SearchPill />
            {/* <ThemeToggle /> - temporarily hidden, will revisit dark mode later */}
            <ProfileMenu />
          </div>

          <div className="navbar-mobile-actions">
            <SearchPill />
            {/* <ThemeToggle /> */}
            <ProfileMenu />
          </div>
        </div>
      </Container>
    </header>
  );
}

export default Navbar;
