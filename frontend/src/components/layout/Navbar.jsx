import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

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
    }
  };

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
            {searchOpen && (
              <form className="navbar-search-form" onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  autoFocus
                  placeholder="Search rooms, PG, area..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onBlur={() => !searchValue && setSearchOpen(false)}
                />
              </form>
            )}

            <button
              type="button"
              className="navbar-search-btn"
              aria-label="Search"
              onClick={() => setSearchOpen((prev) => !prev)}
            >
              <Search size={20} />
            </button>

            <ProfileMenu />
          </div>

          <div className="navbar-mobile-actions">
            <button
              type="button"
              className="navbar-search-btn"
              aria-label="Search"
              onClick={() => navigate("/rooms")}
            >
              <Search size={20} />
            </button>
            <ProfileMenu />
          </div>
        </div>
      </Container>
    </header>
  );
}

export default Navbar;
