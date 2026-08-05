import { NavLink } from "react-router-dom";

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

  const links = user
    ? [
        ...navLinks,
        {
          name: "Wishlist",
          path: "/wishlist",
        },
      ]
    : navLinks;

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
            <ProfileMenu />
          </div>

          <div className="navbar-mobile-actions">
            <ProfileMenu />
          </div>
        </div>
      </Container>
    </header>
  );
}

export default Navbar;