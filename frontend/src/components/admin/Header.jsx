import { useMemo, useState } from "react";
import { Search, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminAlertBell from "./AdminAlertBell";
import cafes from "../../data/cafes";
import "../../styles/admin/header.css";

const adminSearchPages = [
  { label: "Dashboard", detail: "Admin home", href: "/admin/dashboard" },
  { label: "Cafe Menus", detail: "Cafe directory", href: "/admin/cafe-menus" },
  { label: "Cafe Ads", detail: "Manage promotions", href: "/admin/ads" },
  { label: "Analytics", detail: "Site and cafe analytics", href: "/admin/analytics" },
  { label: "Manage Rooms", detail: "Room listings", href: "/admin/rooms" },
  { label: "Manage Users", detail: "User accounts", href: "/admin/users" },
  { label: "Notifications", detail: "Admin notifications", href: "/admin/notifications" },
];

function Header({ openSidebar }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const term = search.trim().toLowerCase();
  const results = useMemo(() => {
    if (!term) return [];
    const cafeResults = cafes
      .filter((cafe) => `${cafe.name} ${cafe.area} ${cafe.address}`.toLowerCase().includes(term))
      .map((cafe) => ({
        label: cafe.name,
        detail: `${cafe.area} · Open menu`,
        href: cafe.menuUrl,
        external: true,
      }));
    const pageResults = adminSearchPages.filter((page) =>
      `${page.label} ${page.detail}`.toLowerCase().includes(term)
    );
    return [...cafeResults, ...pageResults].slice(0, 7);
  }, [term]);

  return (
    <header className="admin-header">
      <div className="header-left">
        <button
          className="menu-btn"
          type="button"
          aria-label="Open admin menu"
          onClick={openSidebar}
        >
          <Menu size={24} />
        </button>
        <div>
          <h1>Dashboard</h1>
          <p>
            Welcome back,
            <span>
              {" "}
              {user?.name || "Super Admin"} 👋
            </span>
          </p>
        </div>
      </div>
      <div className="header-right">
        <div className="header-search-wrap">
          <form className="header-search" role="search" onSubmit={(event) => {
            event.preventDefault();
            const firstResult = results[0];
            if (!firstResult) return;
            if (firstResult.external) window.open(firstResult.href, "_blank", "noopener,noreferrer");
            else navigate(firstResult.href);
            setSearch("");
            setSearchOpen(false);
          }}>
          <Search size={18} />
            <input
              type="search"
              placeholder="Search cafes or admin pages..."
              aria-label="Search cafes or admin pages"
              aria-expanded={searchOpen && Boolean(term)}
              aria-controls="admin-search-results"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearchOpen(false);
              }}
            />
            {searchOpen && term && (
              <div className="header-search-results" id="admin-search-results">
                {results.length ? results.map((result) => (
                  result.external ? (
                    <a
                      key={`${result.label}-${result.href}`}
                      href={result.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => { setSearch(""); setSearchOpen(false); }}
                    >
                      <strong>{result.label}</strong><small>{result.detail}</small>
                    </a>
                  ) : (
                    <Link
                      key={result.href}
                      to={result.href}
                      onClick={() => { setSearch(""); setSearchOpen(false); }}
                    >
                      <strong>{result.label}</strong><small>{result.detail}</small>
                    </Link>
                  )
                )) : <p>No matching cafes or admin pages.</p>}
              </div>
            )}
          </form>
        </div>
        <AdminAlertBell />
        <div className="admin-profile">
          <div className="avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div>
            <h4>{user?.name}</h4>
            <p>{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;